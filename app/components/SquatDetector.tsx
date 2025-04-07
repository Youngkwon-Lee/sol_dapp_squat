'use client';

import { useEffect, useRef, useState } from 'react';

interface SquatDetectorProps {
  onSquatComplete: () => void;
  onError: (message: string) => void;
}

const SquatDetector: React.FC<SquatDetectorProps> = ({ onSquatComplete, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState<string>('카메라 초기화 중...');
  const [hasWebcam, setHasWebcam] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [squatCount, setSquatCount] = useState(0);
  const [viewMode, setViewMode] = useState<'front' | 'side'>('front');
  const [kneeAngle, setKneeAngle] = useState<number>(0);
  const [kneeValgus, setKneeValgus] = useState<number>(0);
  const [isFullBodyVisible, setIsFullBodyVisible] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastSquatTime, setLastSquatTime] = useState<number | null>(null);
  const [isSquatting, setIsSquatting] = useState(false);
  
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
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: { ideal: 'user' },
          aspectRatio: { ideal: 16/9 }
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

  // 키포인트 그리기 함수
  const drawKeypoints = (keypoints: any[], minConfidence: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    if (videoRef.current) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 스켈레톤 연결 정의
    const connections = [
      ['nose', 'leftEye'], ['leftEye', 'leftEar'],
      ['nose', 'rightEye'], ['rightEye', 'rightEar'],
      ['nose', 'leftShoulder'], ['nose', 'rightShoulder'],
      ['leftShoulder', 'rightShoulder'],
      ['leftShoulder', 'leftElbow'], ['leftElbow', 'leftWrist'],
      ['rightShoulder', 'rightElbow'], ['rightElbow', 'rightWrist'],
      ['leftShoulder', 'leftHip'], ['rightShoulder', 'rightHip'],
      ['leftHip', 'rightHip'],
      ['leftHip', 'leftKnee'], ['leftKnee', 'leftAnkle'],
      ['rightHip', 'rightKnee'], ['rightKnee', 'rightAnkle']
    ];

    // 선 그리기 - 더 두껍고 밝게
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.9)'; // 더 밝은 보라색
    
    connections.forEach(([partA, partB]) => {
      const pointA = keypoints.find(kp => kp.part === partA);
      const pointB = keypoints.find(kp => kp.part === partB);
      
      if (pointA && pointB && pointA.score > 0.2 && pointB.score > 0.2) { // 신뢰도 임계값 낮춤
        ctx.beginPath();
        ctx.moveTo(pointA.position.x, pointA.position.y);
        ctx.lineTo(pointB.position.x, pointB.position.y);
        ctx.stroke();
      }
    });

    // 키포인트 그리기 - 더 크고 밝게
    keypoints.forEach(keypoint => {
      if (keypoint.score >= 0.2) { // 신뢰도 임계값 낮춤
        const { y, x } = keypoint.position;
        
        // 그라데이션 생성
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 10);
        gradient.addColorStop(0, 'rgba(168, 85, 247, 1)'); // 더 밝은 보라색
        gradient.addColorStop(1, 'rgba(147, 51, 234, 0.6)'); // 더 밝은 보라색
        
        // 외부 원
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 내부 원
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(168, 85, 247, 1)';
        ctx.fill();
      }
    });

    // 스쿼트 카운트와 각도 표시를 위한 배경 추가
    const padding = 10;
    const lineHeight = 30;
    const textY = 30;
    
    ctx.font = 'bold 24px Arial';
    const countText = `스쿼트: ${squatCount}회`;
    const countWidth = ctx.measureText(countText).width;
    
    // 배경
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.roundRect(padding - 5, textY - 24, countWidth + 10, lineHeight, 5);
    ctx.fill();
    
    // 텍스트
    ctx.fillStyle = '#fff';
    ctx.fillText(countText, padding, textY);

    // 각도 표시
    const angleText = viewMode === 'side' 
      ? `무릎 각도: ${Math.round(kneeAngle)}°`
      : `무릎 안쪽 각도: ${Math.round(kneeValgus)}°`;
    const angleWidth = ctx.measureText(angleText).width;
    
    // 각도 배경
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.roundRect(padding - 5, textY + 5, angleWidth + 10, lineHeight, 5);
    ctx.fill();
    
    // 각도 텍스트
    ctx.fillStyle = '#fff';
    ctx.fillText(angleText, padding, textY + 30);
  };

  // 무릎 각도 계산 함수
  const calculateKneeAngle = (keypoints: any[]) => {
    const leftHip = keypoints.find(kp => kp.part === 'leftHip');
    const leftKnee = keypoints.find(kp => kp.part === 'leftKnee');
    const leftAnkle = keypoints.find(kp => kp.part === 'leftAnkle');

    if (leftHip && leftKnee && leftAnkle && 
        leftHip.score > 0.5 && leftKnee.score > 0.5 && leftAnkle.score > 0.5) {
      const angle = calculateAngle(
        leftHip.position,
        leftKnee.position,
        leftAnkle.position
      );
      setKneeAngle(angle);
      return angle;
    }
    return 0;
  };

  // knee valgus 계산 함수
  const calculateKneeValgus = (keypoints: any[]) => {
    const leftHip = keypoints.find(kp => kp.part === 'leftHip');
    const leftKnee = keypoints.find(kp => kp.part === 'leftKnee');
    const rightHip = keypoints.find(kp => kp.part === 'rightHip');
    const rightKnee = keypoints.find(kp => kp.part === 'rightKnee');

    if (leftHip && leftKnee && rightHip && rightKnee &&
        leftHip.score > 0.5 && leftKnee.score > 0.5 && 
        rightHip.score > 0.5 && rightKnee.score > 0.5) {
      // 무릎이 안쪽으로 들어간 정도를 각도로 계산
      const hipWidth = Math.abs(leftHip.position.x - rightHip.position.x);
      const kneeWidth = Math.abs(leftKnee.position.x - rightKnee.position.x);
      const valgusAngle = Math.acos(kneeWidth / hipWidth) * (180 / Math.PI);
      setKneeValgus(valgusAngle);
      return valgusAngle;
    }
    return 0;
  };

  // 세 점 사이의 각도 계산 함수
  const calculateAngle = (point1: {x: number, y: number}, 
                         point2: {x: number, y: number}, 
                         point3: {x: number, y: number}) => {
    const angle1 = Math.atan2(point1.y - point2.y, point1.x - point2.x);
    const angle2 = Math.atan2(point3.y - point2.y, point3.x - point2.x);
    let angle = (angle2 - angle1) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    return angle;
  };

  // 전신 감지 확인 함수
  const checkFullBodyVisibility = (keypoints: any[]) => {
    const requiredParts = [
      'nose', 
      'leftShoulder', 'rightShoulder',
      'leftHip', 'rightHip',
      'leftKnee', 'rightKnee'
    ];
    
    const visibleParts = keypoints.filter(kp => kp.score > 0.2).map(kp => kp.part);
    const isVisible = requiredParts.every(part => visibleParts.includes(part));
    setIsFullBodyVisible(isVisible);
    return isVisible;
  };

  // 에러 처리 함수
  const handleError = (message: string) => {
    console.error('스쿼트 감지 오류:', message);
    setError(message);
    setIsDetecting(false);
    onError(message);
  };

  // 스쿼트 감지 상태 업데이트 함수
  const updateSquatStatus = (isDetected: boolean) => {
    setIsDetecting(isDetected);
    if (isDetected) {
      setLastSquatTime(Date.now());
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
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
            facingMode: { ideal: 'user' },
            aspectRatio: { ideal: 16/9 }
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
          inputResolution: { width: 1280, height: 720 },
          multiplier: isMobile ? 0.5 : 0.75,
          quantBytes: 2
        });

        if (!isMounted) return;

        let prevHipY = 0;
        let squatStarted = false;
        let frameCount = 0;
        let lastProcessedTime = 0;

        const detectPose = async () => {
          if (!videoRef.current || !videoRef.current.videoWidth) {
            handleError('비디오 스트림이 초기화되지 않았습니다.');
            return;
          }

          const now = performance.now();
          if (now - lastProcessedTime < (isMobile ? 100 : 33.33)) {
            if (isMounted) {
              requestAnimationFrame(detectPose);
            }
            return;
          }
          lastProcessedTime = now;

          try {
            const pose = await net.estimateSinglePose(videoRef.current, {
              flipHorizontal: !isMobile
            });
            
            if (!isMounted) return;

            const isFullBody = checkFullBodyVisibility(pose.keypoints);
            if (!isFullBody) {
              handleError('전신이 보이지 않습니다. 카메라와의 거리를 조절해주세요.');
              return;
            }
            
            // 키포인트와 스켈레톤 그리기
            drawKeypoints(pose.keypoints, 0.2);

            if (viewMode === 'side') {
              const angle = calculateKneeAngle(pose.keypoints);
              if (angle === 0) {
                handleError('무릎 각도를 감지할 수 없습니다. 측면을 정확히 보여주세요.');
                return;
              }

              if (angle > 150 && !squatStarted) {
                updateSquatStatus(true);
                squatStarted = true;
              } else if (angle < 100 && squatStarted) {
                updateSquatStatus(false);
                squatStarted = false;
                if (isMounted) {
                  setSquatCount(prev => prev + 1);
                  onSquatComplete();
                }
              }
            } else {
              const leftHip = pose.keypoints.find(kp => kp.part === 'leftHip');
              const rightHip = pose.keypoints.find(kp => kp.part === 'rightHip');
              const valgus = calculateKneeValgus(pose.keypoints);
              
              if (!leftHip || !rightHip || leftHip.score <= 0.2 || rightHip.score <= 0.2) {
                handleError('엉덩이 위치를 감지할 수 없습니다. 정면을 정확히 보여주세요.');
                return;
              }

              const avgHipY = (leftHip.position.y + rightHip.position.y) / 2;
              const threshold = isMobile ? 50 : 30;
              
              if (!squatStarted && avgHipY > prevHipY + threshold && valgus < 20) {
                updateSquatStatus(true);
                squatStarted = true;
              } else if (squatStarted && avgHipY < prevHipY - threshold && valgus < 20) {
                updateSquatStatus(false);
                squatStarted = false;
                if (isMounted) {
                  setSquatCount(prev => prev + 1);
                  onSquatComplete();
                }
              }
              
              prevHipY = avgHipY;
            }

            // 에러 상태 초기화
            if (error) {
              setError(null);
            }

          } catch (err) {
            handleError('포즈 감지 중 오류가 발생했습니다. 다시 시도해주세요.');
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
    <div className="relative">
      {showGuide && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 rounded-lg">
          <div className="text-center p-6 bg-gray-800/90 rounded-lg max-w-md">
            <h3 className="text-xl font-bold mb-4 text-purple-400">웹캠 사용 가이드</h3>
            <ul className="text-left space-y-2 text-gray-200 mb-6">
              <li>• 카메라와 1-2m 거리를 유지해주세요</li>
              <li>• 상반신과 하반신이 모두 보이도록 해주세요</li>
              <li>• {viewMode === 'front' ? '정면' : '측면'}을 카메라에 보여주세요</li>
              <li>• 밝은 곳에서 진행해주세요</li>
            </ul>
            <button
              onClick={() => setShowGuide(false)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              시작하기
            </button>
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-auto rounded-lg"
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* 에러 메시지 표시 */}
      {error && (
        <div className="absolute top-4 left-4 z-30 bg-red-600/90 text-white p-4 rounded-lg max-w-md">
          <p className="font-bold mb-2">⚠️ 오류 발생</p>
          <p>{error}</p>
        </div>
      )}

      {/* 스쿼트 감지 상태 표시 */}
      {!error && isDetecting && (
        <div className="absolute top-4 left-4 z-30 bg-green-600/90 text-white p-4 rounded-lg">
          <p className="font-bold">스쿼트 감지 중...</p>
          <p className="text-sm">올바른 자세를 유지해주세요</p>
        </div>
      )}

      {/* 마지막 스쿼트 시간 표시 */}
      {lastSquatTime && !isDetecting && !error && (
        <div className="absolute top-4 left-4 z-30 bg-blue-600/90 text-white p-4 rounded-lg">
          <p className="font-bold">스쿼트 완료!</p>
          <p className="text-sm">
            {Math.floor((Date.now() - lastSquatTime) / 1000)}초 전
          </p>
        </div>
      )}

      {!isFullBodyVisible && !isLoading && !showGuide && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="text-center p-4 bg-red-900/80 rounded-lg">
            <p className="text-white">전신이 보이지 않습니다</p>
            <p className="text-sm text-gray-300">카메라와의 거리를 조절해주세요</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>{loadingStatus}</p>
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => {
            setViewMode('front');
            setShowGuide(true);
          }}
          className={`px-3 py-2 rounded-lg ${
            viewMode === 'front' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-600 text-gray-300'
          }`}
        >
          정면
        </button>
        <button
          onClick={() => {
            setViewMode('side');
            setShowGuide(true);
          }}
          className={`px-3 py-2 rounded-lg ${
            viewMode === 'side' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-600 text-gray-300'
          }`}
        >
          측면
        </button>
      </div>

      {cameras.length > 1 && (
        <select
          value={selectedCamera}
          onChange={(e) => handleCameraChange(e.target.value)}
          className="absolute bottom-4 right-4 bg-purple-600 text-white px-3 py-2 rounded-lg"
        >
          {cameras.map(camera => (
            <option key={camera.deviceId} value={camera.deviceId}>
              {camera.label || `카메라 ${camera.deviceId.slice(0, 5)}`}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default SquatDetector; 