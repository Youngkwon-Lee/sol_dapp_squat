import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface WorkoutSession {
  userId: string;
  count: number;
  timestamp: Timestamp;
  duration: number; // 운동 시간 (초)
  mode: 'webcam' | 'manual'; // 운동 모드
}

export async function saveWorkoutSession(
  userId: string,
  count: number,
  duration: number,
  mode: 'webcam' | 'manual'
) {
  try {
    const workoutData: WorkoutSession = {
      userId,
      count,
      timestamp: Timestamp.now(),
      duration,
      mode
    };

    const docRef = await addDoc(collection(db, 'workouts'), workoutData);
    return docRef.id;
  } catch (error) {
    console.error('운동 세션 저장 실패:', error);
    throw error;
  }
}

export async function getWorkoutHistory(userId: string): Promise<(WorkoutSession & { id: string })[]> {
  try {
    const q = query(
      collection(db, 'workouts'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as WorkoutSession & { id: string }));
  } catch (error) {
    console.error('운동 기록 조회 실패:', error);
    throw error;
  }
}

export async function getWorkoutStats(userId: string) {
  try {
    const workouts = await getWorkoutHistory(userId);
    
    return {
      totalSessions: workouts.length,
      totalSquats: workouts.reduce((sum, workout) => sum + workout.count, 0),
      totalDuration: workouts.reduce((sum, workout) => sum + workout.duration, 0),
      averageSquatsPerSession: workouts.length > 0 
        ? Math.round(workouts.reduce((sum, workout) => sum + workout.count, 0) / workouts.length) 
        : 0
    };
  } catch (error) {
    console.error('운동 통계 계산 실패:', error);
    throw error;
  }
} 