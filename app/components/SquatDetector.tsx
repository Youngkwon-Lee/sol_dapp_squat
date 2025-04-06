'use client';

import { useEffect, useRef, useState } from 'react';

interface SquatDetectorProps {
  onSquatComplete: () => void;
  onError: (message: string) => void;
}

const SquatDetector: React.FC<SquatDetectorProps> = ({ onSquatComplete, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState<string>('카메라 초기화 중...');
  const [hasWebcam, setHasWebcam] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  
  // 사용 가능한 카메라 목록 가져오기
  const getCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('카메라 목록 가져오기 실패:', err);
    }
  };

  // 카메라 변경 핸들러
  const handleCameraChange = async (deviceId: string) => {
    setSelectedCamera(deviceId);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          deviceId: { exact: deviceId },
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        }
      });
      
      if (videoRef.current) {
        const oldStream = videoRef.current.srcObject as MediaStream;
        if (oldStream) {
          oldStream.getTracks().forEach(track => track.stop());
        }
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('카메라 변경 중 오류:', err);
      onError('카메라 변경 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    let stream: MediaStream | null = null;

    const checkWebcam = async () => {
      try {
        // HTTPS 체크
        if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          throw new Error('웹캠 사용을 위해서는 HTTPS가 필요합니다.');
        }

        // 카메라 목록 가져오기
        await getCameras();

        // TensorFlow.js 먼저 로드
        setLoadingStatus('AI 모델 초기화 중...');
        const tf = await import('@tensorflow/tfjs');
        await tf.ready();
        
        if (!isMounted) return;

        // 웹캠 장치 확인
        setLoadingStatus('웹캠 확인 중...');
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        setHasWebcam(hasCamera);
        
        if (!hasCamera) {
          throw new Error('웹캠을 찾을 수 없습니다.');
        }

        // 모바일 환경 확인
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // 웹캠 권한 요청
        setLoadingStatus('카메라 권한 요청 중...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
            width: { ideal: isMobile ? 1280 : 640 },
            height: { ideal: isMobile ? 720 : 480 },
            frameRate: { ideal: 30 }
          }
        });
        
        if (!isMounted) return;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true'); // iOS Safari 대응
          
          // 비디오 로드 완료 대기
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadeddata = resolve;
            }
          });
        }

        if (!isMounted) return;

        // PoseNet 모델 로드 - 모바일 최적화 설정
        setLoadingStatus('AI 모델 로드 중...');
        const posenet = await import('@tensorflow-models/posenet');
        const net = await posenet.load({
          architecture: 'MobileNetV1',
          outputStride: 16,
          inputResolution: { width: 640, height: 480 },
          multiplier: isMobile ? 0.5 : 0.75, // 모바일에서는 더 가벼운 모델 사용
          quantBytes: 2
        });

        if (!isMounted) return;

        let prevHipY = 0;
        let squatStarted = false;
        let frameCount = 0;
        let lastProcessedTime = 0;

        const detectPose = async () => {
          if (!videoRef.current || !videoRef.current.videoWidth) {
            if (isMounted) {
              requestAnimationFrame(detectPose);
            }
            return;
          }

          const now = performance.now();
          // 모바일에서는 프레임 처리 간격을 더 길게 설정 (100ms)
          if (now - lastProcessedTime < (isMobile ? 100 : 33.33)) {
            if (isMounted) {
              requestAnimationFrame(detectPose);
            }
            return;
          }
          lastProcessedTime = now;

          try {
            const pose = await net.estimateSinglePose(videoRef.current, {
              flipHorizontal: !isMobile // 전면 카메라일 때만 좌우 반전
            });
            
            if (!isMounted) return;

            const leftHip = pose.keypoints.find(kp => kp.part === 'leftHip');
            const rightHip = pose.keypoints.find(kp => kp.part === 'rightHip');
            
            if (leftHip && rightHip && leftHip.score > 0.5 && rightHip.score > 0.5) {
              const avgHipY = (leftHip.position.y + rightHip.position.y) / 2;
              
              // 모바일에서는 더 큰 움직임 감지
              const threshold = isMobile ? 60 : 40;
              
              if (!squatStarted && avgHipY > prevHipY + threshold) {
                squatStarted = true;
              } else if (squatStarted && avgHipY < prevHipY - threshold) {
                squatStarted = false;
                if (isMounted) {
                  onSquatComplete();
                }
              }
              
              prevHipY = avgHipY;
            }
          } catch (err) {
            console.error('포즈 감지 중 오류:', err);
          }
          
          if (isMounted) {
            requestAnimationFrame(detectPose);
          }
        };

        setIsLoading(false);
        detectPose();

      } catch (err) {
        console.error('카메라 초기화 오류:', err);
        if (isMounted) {
          setIsLoading(false);
          if (err instanceof Error) {
            if (err.name === 'NotAllowedError') {
              onError('카메라 접근 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
            } else if (err.name === 'NotFoundError') {
              onError('웹캠을 찾을 수 없습니다. 웹캠이 연결되어 있는지 확인해주세요.');
            } else if (err.name === 'NotReadableError') {
              onError('웹캠에 접근할 수 없습니다. 다른 프로그램이 웹캠을 사용 중인지 확인해주세요.');
            } else {
              onError(`${err.message || '카메라를 초기화하는 중 오류가 발생했습니다.'} (${err.name})`);
            }
          } else {
            onError('알 수 없는 오류가 발생했습니다. 수동 카운팅을 이용해주세요.');
          }
        }
      }
    };

    checkWebcam();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onSquatComplete, onError]);

  if (!hasWebcam) {
    return null;
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-lg">
          <div className="text-white text-center">
            <div className="mb-2">{loadingStatus}</div>
            <div className="text-sm text-gray-300">잠시만 기다려주세요...</div>
          </div>
        </div>
      )}
      {cameras.length > 1 && (
        <div className="absolute top-4 right-4 z-10">
          <select
            className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm"
            value={selectedCamera}
            onChange={(e) => handleCameraChange(e.target.value)}
          >
            {cameras.map((camera) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `카메라 ${cameras.indexOf(camera) + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover rounded-lg"
        style={{ transform: 'scaleX(-1)' }}
      />
    </div>
  );
};

export default SquatDetector; 