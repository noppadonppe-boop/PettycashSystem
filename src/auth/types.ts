import type { Timestamp } from 'firebase/firestore';
import type { UserRole } from './roles';

export type UserApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  roles: UserRole[]; // multi-role support (union of permissions)
  status: UserApprovalStatus;
  assignedProjects: string[];
  createdAt: Timestamp;
  photoURL?: string;
  isFirstUser: boolean;
}

export interface AppMetaConfig {
  firstUserRegistered: boolean;
  totalUsers: number;
  createdAt: Timestamp;
}

export type ActivityAction = 'REGISTER' | 'LOGIN';

export interface ActivityLog {
  action: ActivityAction;
  uid: string;
  email: string;
  provider: 'password' | 'google';
  createdAt: Timestamp;
}
