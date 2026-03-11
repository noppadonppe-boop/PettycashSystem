import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider, APP_NAME } from '../firebase/firebase';
import { setSessionExpiry, clearSession } from './session';
import { fetchUserProfile, ensureUserProfileForGoogle, registerProfileWithFirstUserDetection } from './userProfileStore';
import { logActivity } from './activityLog';
import type { UserProfile } from './types';

export class AuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function mapAuthError(e: unknown): AuthError {
  const code = (e as { code?: string })?.code ?? 'auth/unknown';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return new AuthError(code, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    case 'auth/popup-closed-by-user':
      return new AuthError('popup-closed', 'ปิดหน้าต่างเข้าสู่ระบบก่อนสำเร็จ');
    case 'auth/unauthorized-domain':
      return new AuthError('unauthorized-domain', 'โดเมนนี้ยังไม่ได้รับอนุญาตใน Firebase Auth');
    default:
      return new AuthError(code, 'เกิดข้อผิดพลาดในการยืนยันตัวตน');
  }
}

async function getProfileOrThrow(user: FirebaseUser): Promise<UserProfile> {
  const profile = await fetchUserProfile(user.uid);
  if (!profile) {
    throw new AuthError('profile-not-found', 'ไม่พบโปรไฟล์ผู้ใช้ในระบบ');
  }
  return profile;
}

export async function loginWithEmail(email: string, password: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Critical: set session immediately after sign-in.
    setSessionExpiry(APP_NAME);
    const profile = await getProfileOrThrow(cred.user);
    logActivity({ action: 'LOGIN', uid: profile.uid, email: profile.email, provider: 'password' });
    return profile;
  } catch (e) {
    throw mapAuthError(e);
  }
}

export async function loginWithGoogle() {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    // Critical: set session immediately after sign-in.
    setSessionExpiry(APP_NAME);

    const isNew = await ensureUserProfileForGoogle({
      uid: cred.user.uid,
      email: cred.user.email ?? '',
      photoURL: cred.user.photoURL,
    });

    const profile = await getProfileOrThrow(cred.user);
    if (isNew) {
      logActivity({ action: 'REGISTER', uid: profile.uid, email: profile.email, provider: 'google' });
    }
    logActivity({ action: 'LOGIN', uid: profile.uid, email: profile.email, provider: 'google' });
    return profile;
  } catch (e) {
    throw mapAuthError(e);
  }
}

export async function registerWithEmail(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  position: string;
}) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
    // Critical: set session immediately after sign-in.
    setSessionExpiry(APP_NAME);

    await registerProfileWithFirstUserDetection({
      uid: cred.user.uid,
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      position: params.position,
      photoURL: cred.user.photoURL,
    });

    const profile = await getProfileOrThrow(cred.user);
    logActivity({ action: 'REGISTER', uid: profile.uid, email: profile.email, provider: 'password' });
    return profile;
  } catch (e) {
    throw mapAuthError(e);
  }
}

export async function logout() {
  clearSession(APP_NAME);
  await signOut(auth);
}

