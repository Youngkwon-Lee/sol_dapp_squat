'use client';

import { useEffect, useRef, useState } from 'react';

interface SquatDetectorProps {
  onSquatComplete: () => void;
  onError: (message: string) => void;
}

const SquatDetector: React.FC<SquatDetectorProps> = ({ onSquatComplete, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasWebcam, setHasWebcam] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkWebcam = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        setHasWebcam(hasCamera);
        
        if (!hasCamera) {
          setIsLoading(false);
          onError('웹캠을 찾을 수 없습니다. 수동 카운팅을 이용해주세요.');
          return;
        }

        // 웹캠 접근
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // PoseNet 모델 로드
        const posenet = await import('@tensorflow-models/posenet');
        const net = await posenet.load({
          architecture: 'MobileNetV1',
          outputStride: 16,
          inputResolution: { width: 640, height: 480 },
          multiplier: 0.75
        });

        let prevHipY = 0;
        let squatStarted = false;
        let frameCount = 0;

        const detectPose = async () => {
          if (!videoRef.current || !videoRef.current.videoWidth) {
            requestAnimationFrame(detectPose);
            return;
          }

          // 성능 최적화를 위해 3프레임당 1번만 감지
          frameCount++;
          if (frameCount % 3 !== 0) {
            requestAnimationFrame(detectPose);
            return;
          }

          try {
            const pose = await net.estimateSinglePose(videoRef.current, {
              flipHorizontal: false
            });
            
            // 왼쪽/오른쪽 엉덩이 키포인트 찾기
            const leftHip = pose.keypoints.find(kp => kp.part === 'leftHip');
            const rightHip = pose.keypoints.find(kp => kp.part === 'rightHip');
            
            if (leftHip && rightHip && leftHip.score > 0.5 && rightHip.score > 0.5) {
              // 양쪽 엉덩이의 평균 y 좌표 사용
              const avgHipY = (leftHip.position.y + rightHip.position.y) / 2;
              
              // 스쿼트 감지 로직
              if (!squatStarted && avgHipY > prevHipY + 40) { // 스쿼트 시작
                squatStarted = true;
              } else if (squatStarted && avgHipY < prevHipY - 40) { // 스쿼트 완료
                squatStarted = false;
                onSquatComplete();
              }
              
              prevHipY = avgHipY;
            }
          } catch (err) {
            console.error('포즈 감지 중 오류:', err);
          }
          
          requestAnimationFrame(detectPose);
        };

        setIsLoading(false);
        detectPose();

        return () => {
          stream.getTracks().forEach(track => track.stop());
        };
      } catch (err) {
        console.error('카메라 초기화 오류:', err);
        setIsLoading(false);
        onError('카메라를 초기화하는 중 오류가 발생했습니다. 수동 카운팅을 이용해주세요.');
      }
    };

    checkWebcam();
  }, [onSquatComplete, onError]);

  if (!hasWebcam) {
    return null;
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-lg">
          <div className="text-white">카메라 초기화 중...</div>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full rounded-lg"
        style={{ transform: 'scaleX(-1)' }}
      />
    </div>
  );
};

export default SquatDetector; 