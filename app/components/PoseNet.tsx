'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as posenet from '@tensorflow-models/posenet';

interface Props {
  onSquatComplete: () => void;
}

const PoseNet: React.FC<Props> = ({ onSquatComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSquatting, setIsSquatting] = useState(false);
  const [squatCount, setSquatCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let net: posenet.PoseNet;

    const initTensorFlow = async () => {
      // TensorFlow.js 백엔드 초기화
      await tf.setBackend('webgl');
      await tf.ready();
      
      console.log('TensorFlow.js 백엔드:', tf.getBackend());
    };

    const runPosenet = async () => {
      try {
        setIsLoading(true);
        
        // TensorFlow.js 초기화
        await initTensorFlow();

        // PoseNet 모델 로드
        net = await posenet.load({
          architecture: 'MobileNetV1',
          outputStride: 16,
          inputResolution: { width: 640, height: 480 },
          multiplier: 0.75
        });

        // 카메라 접근
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: 640,
              height: 480
            }
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              detectPose();
              setIsLoading(false);
            };
          }
        }
      } catch (error) {
        console.error('PoseNet 초기화 에러:', error);
        setIsLoading(false);
      }
    };

    const detectPose = async () => {
      if (!net || !videoRef.current) return;

      try {
        const pose = await net.estimateSinglePose(videoRef.current);
        
        // 무릎과 엉덩이의 y좌표를 확인
        const hip = pose.keypoints.find(point => point.part === 'leftHip' || point.part === 'rightHip');
        const knee = pose.keypoints.find(point => point.part === 'leftKnee' || point.part === 'rightKnee');

        if (hip && knee && hip.position.y && knee.position.y) {
          const hipKneeDistance = Math.abs(hip.position.y - knee.position.y);
          
          // 스쿼트 동작 감지
          if (hipKneeDistance < 50 && !isSquatting) {
            setIsSquatting(true);
          } else if (hipKneeDistance > 100 && isSquatting) {
            setIsSquatting(false);
            setSquatCount(prev => {
              const newCount = prev + 1;
              if (newCount === 30) {
                onSquatComplete();
              }
              return newCount;
            });
          }
        }

        requestAnimationFrame(detectPose);
      } catch (error) {
        console.error('포즈 감지 에러:', error);
      }
    };

    runPosenet();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isSquatting, onSquatComplete]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg">카메라 및 AI 모델을 초기화하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
      />
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-4 rounded-lg">
        <div className="text-xl font-bold">스쿼트 횟수: {squatCount} / 30</div>
        <div className="text-sm mt-1">{isSquatting ? '스쿼트 중...' : '서있는 자세'}</div>
      </div>
    </div>
  );
};

export default PoseNet; 