import React, { createContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  username: string;
  isPremium: boolean;
  chatTimeUsed: number;
  timeLeft: number;
  timeLimit: number;
  token: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, user: any) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUsageLocally: (seconds: number) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
  updateUsageLocally: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Invalid token');
      })
      .then(data => {
        setUser({ ...data, token });
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        setUser(null);
      });
    }
  }, []);

  const login = (token: string, userData: any) => {
    localStorage.setItem('auth_token', token);
    setUser({ ...userData, token });
    refreshUser();
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser({ ...data, token });
      }
    }
  };

  const updateUsageLocally = (seconds: number) => {
    setUser(prev => {
      if (!prev) return prev;
      const newTimeLeft = Math.max(0, prev.timeLeft - seconds);
      return { ...prev, timeLeft: newTimeLeft, chatTimeUsed: prev.chatTimeUsed + seconds };
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, updateUsageLocally }}>
      {children}
    </AuthContext.Provider>
  );
};
