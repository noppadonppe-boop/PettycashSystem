import {
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import { appMetaDocRef, userDocRef } from './firestorePaths';
import type { AppMetaConfig, UserProfile } from './types';
import { normalizeRoles } from './roles';

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

export async function fetchUserProfile(uid: string) {
  const snap = await getDoc(userDocRef(uid));
  if (!snap.exists()) return null;
  const data = snap.data() as DocumentData;
  const roles = normalizeRoles(data.roles ?? data.role);
  return {
    ...(data as Omit<UserProfile, 'roles'>),
    roles,
  } as UserProfile;
}

export async function ensureUserProfileForGoogle(params: {
  uid: string;
  email: string;
  photoURL?: string | null;
}) {
  const ref = userDocRef(params.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return false;
  const profile: Omit<UserProfile, 'createdAt'> & { createdAt: unknown } = {
    uid: params.uid,
    email: params.email,
    firstName: '',
    lastName: '',
    position: '',
    roles: ['Staff'],
    status: 'pending',
    assignedProjects: [],
    createdAt: serverTimestamp(),
    photoURL: params.photoURL ?? undefined,
    isFirstUser: false,
  };
  await setDoc(ref, profile, { merge: true });
  return true;
}

export async function registerProfileWithFirstUserDetection(params: {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  photoURL?: string | null;
}) {
  const metaRef = appMetaDocRef('config');
  const profileRef = userDocRef(params.uid);

  return runTransaction(profileRef.firestore, async (tx) => {
    const metaSnap = await tx.get(metaRef);
    const meta = (metaSnap.exists() ? (metaSnap.data() as Partial<AppMetaConfig>) : null) ?? null;

    const firstUserRegistered = Boolean(meta?.firstUserRegistered);
    const isFirstUser = !firstUserRegistered;

    const roles = isFirstUser ? (['MasterAdmin'] as const) : (['Staff'] as const);
    const status = isFirstUser ? ('approved' as const) : ('pending' as const);

    if (!metaSnap.exists()) {
      tx.set(metaRef, {
        firstUserRegistered: true,
        totalUsers: 1,
        createdAt: serverTimestamp(),
      });
    } else {
      const currentTotal = typeof meta?.totalUsers === 'number' ? meta.totalUsers : 0;
      tx.update(metaRef, {
        firstUserRegistered: true,
        totalUsers: currentTotal + 1,
      });
    }

    tx.set(
      profileRef,
      {
        uid: params.uid,
        email: params.email,
        firstName: asString(params.firstName),
        lastName: asString(params.lastName),
        position: asString(params.position),
        roles: [...roles],
        status,
        assignedProjects: [],
        createdAt: serverTimestamp(),
        photoURL: params.photoURL ?? undefined,
        isFirstUser,
      },
      { merge: true }
    );

    return { isFirstUser, status, roles: [...roles] };
  });
}

export async function updateUserProfile(uid: string, updates: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'position' | 'photoURL'>>) {
  const ref = userDocRef(uid);
  await updateDoc(ref, updates);
}

