import { createContext, useContext, useState } from 'react';
import { USERS } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(USERS[1]); // Default: GM

  const switchUser = (userId) => {
    const user = USERS.find((u) => u.id === userId);
    if (user) setCurrentUser(user);
  };

  const hasRole = (...roles) => roles.includes(currentUser?.role);

  return (
    <AuthContext.Provider value={{ currentUser, switchUser, hasRole, USERS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
