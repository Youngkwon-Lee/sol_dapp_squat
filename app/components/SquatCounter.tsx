'use client';

import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as posenet from '@tensorflow-models/posenet';

interface SquatCounterProps {
  count: number;
  onCountChange: (count: number) => void;
}

const SquatCounter = ({ count, onCountChange }: SquatCounterProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSquatting, setIsSquatting] = useState(false);
  const [viewMode, setViewMode] = useState<'front' | 'side'>('front');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('초기화 중...');
  const [isWebcamAvailable, setIsWebcamAvailable] = useState(true);
  const [isManualMode, setIsManualMode] = useState(false);
  const [net, setNet] = useState<posenet.PoseNet | null>(null);

  // 스쿼트 상태 추적을 위한 임계값
  const SQUAT_THRESHOLD = 0.2; // 스쿼트 깊이 임계값
  const KNEE_ANGLE_THRESHOLD = 130; // 무릎 각도 임계값 (도)

  const metadataUri = "https://arweave.net/your-metadata-uri";

  useEffect(() => {
    let isMounted = true;

    const setupCamera = async () => {
      if (!videoRef.current) return;

      try {
        setLoadingStatus('카메라 권한 요청 중...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        videoRef.current.srcObject = stream;
        return new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current!.play();
              resolve();
            };
          }
        });
      } catch (err) {
        console.error('웹캠 접근 오류:', err);
        setIsWebcamAvailable(false);
        if ((err as Error).name === 'NotFoundError') {
          setError('웹캠을 찾을 수 없습니다. 수동 모드로 전환합니다.');
        } else if ((err as Error).name === 'NotAllowedError') {
          setError('웹캠 접근 권한이 거부되었습니다. 수동 모드로 전환합니다.');
        } else {
          setError('웹캠 접근 중 오류가 발생했습니다. 수동 모드로 전환합니다.');
        }
        setIsManualMode(true);
        setIsLoading(false);
        throw err;
      }
    };

    const initializeTensorFlow = async () => {
      try {
        if (!isMounted) return;
        
        setLoadingStatus('TensorFlow.js 초기화 중...');
        await tf.ready();
        
        if (!isMounted) return;
        
        setLoadingStatus('PoseNet 모델 로드 중...');
        const loadedNet = await posenet.load({
          architecture: 'MobileNetV1',
          outputStride: 16,
          inputResolution: { width: 640, height: 480 },
          multiplier: 0.75,
        });
        
        if (!isMounted) return;
        
        setNet(loadedNet);
        await setupCamera();
        
        if (!isMounted) return;
        
        setIsLoading(false);
        setLoadingStatus('준비 완료');
      } catch (err) {
        console.error('초기화 오류:', err);
        if (isMounted) {
          if (!isManualMode) {
            setError('초기화 중 오류가 발생했습니다. 수동 모드로 전환합니다.');
            setIsManualMode(true);
          }
          setIsLoading(false);
        }
      }
    };

    initializeTensorFlow();

    return () => {
      isMounted = false;
      if (videoRef.current?.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!net || !videoRef.current || !canvasRef.current || !isWebcamAvailable || isLoading || isManualMode) return;

    let animationFrameId: number;
    let isVideoReady = false;

    const checkVideoReady = () => {
      if (videoRef.current?.readyState === 4) {
        isVideoReady = true;
        detectPose();
      } else {
        setTimeout(checkVideoReady, 100);
      }
    };

    const detectPose = async () => {
      if (!isVideoReady) return;

      try {
        const pose = await net.estimateSinglePose(videoRef.current!, {
          flipHorizontal: false,
        });

        const ctx = canvasRef.current!.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, 640, 480);
        ctx.drawImage(videoRef.current!, 0, 0, 640, 480);

        // 키포인트 그리기
        pose.keypoints.forEach((keypoint) => {
          if (keypoint.score > 0.5) {
            ctx.beginPath();
            ctx.arc(keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
          }
        });

        // 스쿼트 감지 로직
        if (viewMode === 'front') {
          detectFrontSquat(pose.keypoints);
        } else {
          detectSideSquat(pose.keypoints);
        }

        animationFrameId = requestAnimationFrame(detectPose);
      } catch (err) {
        console.error('포즈 감지 오류:', err);
      }
    };

    checkVideoReady();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [net, viewMode, isLoading, isManualMode]);

  const detectFrontSquat = (keypoints: posenet.Keypoint[]) => {
    const hips = keypoints.find(kp => kp.part === 'leftHip' || kp.part === 'rightHip');
    const knees = keypoints.find(kp => kp.part === 'leftKnee' || kp.part === 'rightKnee');

    if (!hips || !knees) return;

    const hipHeight = hips.position.y;
    const kneeHeight = knees.position.y;
    const heightDiff = Math.abs(hipHeight - kneeHeight) / 480;

    if (heightDiff < SQUAT_THRESHOLD && !isSquatting) {
      setIsSquatting(true);
      onCountChange(count + 1);
    } else if (heightDiff > SQUAT_THRESHOLD && isSquatting) {
      setIsSquatting(false);
    }
  };

  const detectSideSquat = (keypoints: posenet.Keypoint[]) => {
    const hip = keypoints.find(kp => kp.part === 'leftHip' || kp.part === 'rightHip');
    const knee = keypoints.find(kp => kp.part === 'leftKnee' || kp.part === 'rightKnee');
    const ankle = keypoints.find(kp => kp.part === 'leftAnkle' || kp.part === 'rightAnkle');

    if (!hip || !knee || !ankle) return;

    const angle = calculateAngle(
      hip.position,
      knee.position,
      ankle.position
    );

    if (angle < KNEE_ANGLE_THRESHOLD && !isSquatting) {
      setIsSquatting(true);
      onCountChange(count + 1);
    } else if (angle > KNEE_ANGLE_THRESHOLD && isSquatting) {
      setIsSquatting(false);
    }
  };

  const calculateAngle = (
    hip: { x: number; y: number },
    knee: { x: number; y: number },
    ankle: { x: number; y: number }
  ) => {
    const radians = Math.atan2(ankle.y - knee.y, ankle.x - knee.x) -
                   Math.atan2(hip.y - knee.y, hip.x - knee.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  };

  const handleManualSquat = () => {
    if (!isSquatting) {
      setIsSquatting(true);
      onCountChange(count + 1);
    }
    setIsSquatting(false);
  };

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">{loadingStatus}</p>
        <button
          onClick={() => {
            setIsLoading(false);
            setIsManualMode(true);
            setError('수동 모드로 전환되었습니다.');
          }}
          className="mt-4 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
        >
          수동 모드로 전환
        </button>
      </div>
    );
  }

  if (isManualMode) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50">
        <div className="mb-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">수동 모드 활성화</h3>
          <p className="text-red-400 mb-2">{error}</p>
          <p className="text-gray-300">스쿼트를 수행할 때마다 아래 버튼을 클릭해주세요</p>
        </div>

        <button
          onClick={handleManualSquat}
          className="bg-gradient-to-r from-blue-600 to-blue-400 text-white px-8 py-4 rounded-xl hover:brightness-110 transition-all text-lg font-bold shadow-lg mb-6 w-full max-w-sm"
        >
          스쿼트 완료
        </button>

        <div className="text-center">
          <p className="text-2xl font-bold text-white">
            현재 스쿼트 횟수: <span className="text-blue-400">{count}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="flex justify-center space-x-2 w-full">
        <button
          onClick={() => setViewMode('front')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            viewMode === 'front' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          정면 모드
        </button>
        <button
          onClick={() => setViewMode('side')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            viewMode === 'side' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          측면 모드
        </button>
        <button
          onClick={() => {
            setIsManualMode(true);
            setError('수동 모드로 전환되었습니다.');
            // 웹캠 스트림 정지
            if (videoRef.current?.srcObject instanceof MediaStream) {
              videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
          }}
          className="px-6 py-3 rounded-lg font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all"
        >
          수동 모드로 전환
        </button>
      </div>

      <div className="relative w-[640px] h-[480px] rounded-lg overflow-hidden shadow-xl bg-gray-800/50 backdrop-blur-sm">
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full object-cover"
          width="640"
          height="480"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          width="640"
          height="480"
        />
      </div>

      <div className="text-center">
        <p className="text-white text-lg mb-2">
          {viewMode === 'front' 
            ? '정면을 보고 스쿼트를 수행하세요.' 
            : '측면을 보고 스쿼트를 수행하세요.'}
        </p>
        <p className="text-blue-400 text-xl font-bold">
          현재 스쿼트 횟수: {count}
        </p>
      </div>
    </div>
  );
};

export default SquatCounter; 