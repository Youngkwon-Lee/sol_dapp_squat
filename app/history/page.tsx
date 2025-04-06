'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkoutHistory, getWorkoutStats, WorkoutSession } from '../../services/workoutService';

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const [workouts, setWorkouts] = useState<(WorkoutSession & { id: string })[]>([]);
  const [stats, setStats] = useState<{
    totalSessions: number;
    totalSquats: number;
    totalDuration: number;
    averageSquatsPerSession: number;
  } | null>(null);

  useEffect(() => {
    async function fetchWorkoutData() {
      if (!user) return;

      try {
        const [historyData, statsData] = await Promise.all([
          getWorkoutHistory(user.uid),
          getWorkoutStats(user.uid)
        ]);
        setWorkouts(historyData as (WorkoutSession & { id: string })[]);
        setStats(statsData);
      } catch (error) {
        console.error('운동 데이터 로드 실패:', error);
      }
    }

    if (user) {
      fetchWorkoutData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">로딩중...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">로그인이 필요합니다</h2>
            <p className="mt-4 text-lg text-gray-500">
              운동 기록을 보려면 먼저 로그인해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">운동 기록</h2>
          <p className="mt-4 text-lg text-gray-500">
            지금까지의 운동 기록을 확인해보세요.
          </p>
        </div>

        {stats && (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  총 운동 세션
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {stats.totalSessions}회
                </dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  총 스쿼트 횟수
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {stats.totalSquats}회
                </dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  총 운동 시간
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {Math.round(stats.totalDuration / 60)}분
                </dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  평균 스쿼트 횟수
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {stats.averageSquatsPerSession}회
                </dd>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul role="list" className="divide-y divide-gray-200">
              {workouts.map((workout) => (
                <li key={workout.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(workout.timestamp.seconds * 1000).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {workout.mode === 'webcam' ? '웹캠' : '수동'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {workout.count}회 / {Math.round(workout.duration / 60)}분
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 