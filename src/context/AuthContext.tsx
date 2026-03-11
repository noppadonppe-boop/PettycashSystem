import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, APP_NAME } from '../firebase/firebase';
import type { UserProfile } from '../auth/types';
import { fetchUserProfile } from '../auth/userProfileStore';
import { getRemainingMinutes, isSessionExpired } from '../auth/session';

export interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  sessionMinutesLeft: number;
  refreshProfile: () => Promise<void>;
  // Legacy helpers used across existing pages (keeps layout/modules unchanged)
  currentUser: { id: string; name: string; role: string; avatar: string } | null;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionMinutesLeft, setSessionMinutesLeft] = useState(0);
  const mountedRef = useRef(true);

  const refreshProfile = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) {
      setUserProfile(null);
      return;
    }
    try {
      const profile = await fetchUserProfile(u.uid);
      if (!mountedRef.current) return;
      setUserProfile(profile);
    } catch {
      if (!mountedRef.current) return;
      setUserProfile(null);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!mountedRef.current) return;
      setFirebaseUser(u);

      if (!u) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      // Do NOT force logout here; it can create race conditions.
      try {
        const profile = await fetchUserProfile(u.uid);
        if (!mountedRef.current) return;
        setUserProfile(profile);
      } catch {
        if (!mountedRef.current) return;
        setUserProfile(null);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    const update = () => {
      if (!auth.currentUser) {
        setSessionMinutesLeft(0);
        return;
      }
      setSessionMinutesLeft(getRemainingMinutes(APP_NAME));
    };
    update();
    const t = window.setInterval(update, 60_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    // Keep minutes-left correct when auth changes.
    if (!firebaseUser) setSessionMinutesLeft(0);
  }, [firebaseUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      userProfile,
      loading,
      sessionMinutesLeft,
      refreshProfile,
      currentUser: userProfile
        ? {
            id: userProfile.uid,
            name: [userProfile.firstName, userProfile.lastName].filter(Boolean).join(' ') || userProfile.email,
            role: userProfile.roles?.includes('MasterAdmin')
              ? 'MasterAdmin'
              : userProfile.roles?.[0] ?? 'Staff',
            avatar: (userProfile.firstName?.[0] ?? userProfile.email?.[0] ?? 'U').toUpperCase(),
          }
        : null,
      hasRole: (...roles: string[]) => {
        const rs = userProfile?.roles ?? [];
        if (rs.includes('MasterAdmin' as never)) return true;
        return roles.some((r) => rs.includes(r as never));
      },
    }),
    [firebaseUser, userProfile, loading, sessionMinutesLeft, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useSessionExpired() {
  const { firebaseUser } = useAuth();
  return useMemo(() => (firebaseUser ? isSessionExpired(APP_NAME) : false), [firebaseUser]);
}

