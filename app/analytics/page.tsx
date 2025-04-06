'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/firebaseClient';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';

interface WorkoutSession {
  squatCount: number;
  duration: number;
  timestamp: Timestamp;
  usedWebcam: boolean;
  userId?: string;
  walletAddress?: string;
}

export default function Analytics() {
  const { user } = useAuth();
  const { connected: isWalletConnected, publicKey } = useWallet();
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSquats: 0,
    averagePerSession: 0,
    totalDuration: 0,
    bestStreak: 0,
    webcamUsage: 0,
    averageDuration: 0,
  });

  useEffect(() => {
    async function fetchWorkoutData() {
      if (!user && !isWalletConnected) return;

      try {
        const workoutsRef = collection(db, 'workouts');
        let q;
        
        if (user) {
          q = query(
            workoutsRef,
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc'),
            orderBy('__name__', 'asc')
          );
        } else if (publicKey) {
          const walletAddress = publicKey.toString();
          q = query(
            workoutsRef,
            where('walletAddress', '==', walletAddress),
            orderBy('timestamp', 'desc'),
            orderBy('__name__', 'asc')
          );
        } else {
          return;
        }

        const querySnapshot = await getDocs(q);
        const workoutData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            squatCount: Number(data.squatCount) || 0,
            duration: Number(data.duration) || 0,
            timestamp: data.timestamp,
            usedWebcam: Boolean(data.usedWebcam),
            userId: data.userId,
            walletAddress: data.walletAddress
          };
        }) as WorkoutSession[];

        console.log('Fetched workout data:', workoutData);

        setWorkouts(workoutData);

        // 통계 계산
        const totalSquats = workoutData.reduce((sum, workout) => sum + (workout.squatCount || 0), 0);
        const totalDuration = workoutData.reduce((sum, workout) => sum + (workout.duration || 0), 0);
        const webcamSessions = workoutData.filter(workout => workout.usedWebcam).length;

        console.log('Calculated stats:', {
          totalSquats,
          totalDuration,
          webcamSessions,
          sessionCount: workoutData.length
        });

        // 최고 연속 일수 계산
        const dates = workoutData.map(workout => 
          new Date(workout.timestamp.seconds * 1000).toDateString()
        );
        const uniqueDates = Array.from(new Set(dates)).sort();
        let currentStreak = 1;
        let maxStreak = 1;

        for (let i = 1; i < uniqueDates.length; i++) {
          const prevDate = new Date(uniqueDates[i - 1]);
          const currDate = new Date(uniqueDates[i]);
          const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
          } else {
            currentStreak = 1;
          }
        }

        const stats = {
          totalSquats,
          averagePerSession: workoutData.length ? Math.round(totalSquats / workoutData.length) : 0,
          totalDuration: Math.round(totalDuration / 60), // 분 단위로 변환
          bestStreak: maxStreak,
          webcamUsage: workoutData.length ? Math.round((webcamSessions / workoutData.length) * 100) : 0,
          averageDuration: workoutData.length ? Math.round(totalDuration / workoutData.length) : 0,
        };

        console.log('Final stats:', stats);
        setStats(stats);

      } catch (error) {
        console.error('운동 데이터 가져오기 실패:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkoutData();
  }, [user, isWalletConnected, publicKey]);

  if (!user && !isWalletConnected) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">로그인이 필요합니다</h2>
            <p className="mt-4 text-lg text-gray-400">
              분석 페이지를 보려면 Google 로그인이나 지갑 연결이 필요합니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">데이터 로딩 중...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <Link href="/" className="text-blue-500 hover:text-blue-600 mb-4 sm:mb-0">
            ← 돌아가기
          </Link>
          <h1 className="text-2xl font-bold text-white">운동 분석</h1>
          <div className="flex gap-2">
            {['daily', 'weekly', 'monthly'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period as any)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedPeriod === period
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {period === 'daily' ? '일간' : period === 'weekly' ? '주간' : '월간'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-400 truncate">총 스쿼트 횟수</dt>
              <dd className="mt-1 text-3xl font-semibold text-purple-400">{stats.totalSquats}회</dd>
            </div>
          </div>

          <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-400 truncate">세션당 평균</dt>
              <dd className="mt-1 text-3xl font-semibold text-purple-400">{stats.averagePerSession}회</dd>
            </div>
          </div>

          <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-400 truncate">총 운동 시간</dt>
              <dd className="mt-1 text-3xl font-semibold text-purple-400">{stats.totalDuration}분</dd>
            </div>
          </div>

          <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-400 truncate">최고 연속 일수</dt>
              <dd className="mt-1 text-3xl font-semibold text-purple-400">{stats.bestStreak}일</dd>
            </div>
          </div>

          <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-400 truncate">웹캠 사용률</dt>
              <dd className="mt-1 text-3xl font-semibold text-purple-400">{stats.webcamUsage}%</dd>
            </div>
          </div>

          <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-400 truncate">평균 운동 시간</dt>
              <dd className="mt-1 text-3xl font-semibold text-purple-400">{stats.averageDuration}초</dd>
            </div>
          </div>
        </div>

        {/* 최근 운동 기록 */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-white mb-6">최근 운동 기록</h3>
          <div className="bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">날짜</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">스쿼트 횟수</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">운동 시간</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">측정 방식</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {workouts.slice(0, 5).map((workout, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(workout.timestamp.seconds * 1000).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {workout.squatCount}회
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {Math.round(workout.duration)}초
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {workout.usedWebcam ? '자세 인식' : '수동'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 