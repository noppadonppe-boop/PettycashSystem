import { addDoc, serverTimestamp } from 'firebase/firestore';
import { activityLogsColRef } from './firestorePaths';
import type { ActivityAction } from './types';

export function logActivity(params: {
  action: ActivityAction;
  uid: string;
  email: string;
  provider: 'password' | 'google';
}) {
  return addDoc(activityLogsColRef(), {
    ...params,
    createdAt: serverTimestamp(),
  }).catch(() => {});
}

