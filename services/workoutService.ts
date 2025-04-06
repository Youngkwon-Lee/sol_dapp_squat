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
  userId?: string;
  walletAddress?: string;
  squatCount: number;
  timestamp: Timestamp;
  duration: number;
  usedWebcam: boolean;
}

export async function saveWorkoutSession(
  identifier: string,
  squatCount: number,
  duration: number,
  mode: 'webcam' | 'manual',
  isWallet: boolean = false
) {
  try {
    const workoutData: WorkoutSession = {
      squatCount,
      timestamp: Timestamp.now(),
      duration,
      usedWebcam: mode === 'webcam',
    };

    // Google 로그인인 경우 userId를, 지갑 연결인 경우 walletAddress를 사용
    if (isWallet) {
      workoutData.walletAddress = identifier;
    } else {
      workoutData.userId = identifier;
    }

    const docRef = await addDoc(collection(db, 'workouts'), workoutData);
    return docRef.id;
  } catch (error) {
    console.error('운동 세션 저장 실패:', error);
    throw error;
  }
}

export async function getWorkoutHistory(identifier: string, isWallet: boolean = false): Promise<(WorkoutSession & { id: string })[]> {
  try {
    const q = query(
      collection(db, 'workouts'),
      where(isWallet ? 'walletAddress' : 'userId', '==', identifier),
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

export async function getWorkoutStats(identifier: string, isWallet: boolean = false) {
  try {
    const workouts = await getWorkoutHistory(identifier, isWallet);
    
    return {
      totalSessions: workouts.length,
      totalSquats: workouts.reduce((sum, workout) => sum + workout.squatCount, 0),
      totalDuration: workouts.reduce((sum, workout) => sum + workout.duration, 0),
      averageSquatsPerSession: workouts.length > 0 
        ? Math.round(workouts.reduce((sum, workout) => sum + workout.squatCount, 0) / workouts.length) 
        : 0
    };
  } catch (error) {
    console.error('운동 통계 계산 실패:', error);
    throw error;
  }
} 