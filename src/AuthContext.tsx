import React, { createContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  username: string;
  isPremium: boolean;
  chatTimeUsed: number;
  timeLeft: number;
  timeLimit: number;
  token: string | null;
  whatsapp?: string;
  isWhatsappPublic?: boolean;
  performanceScore?: number;
  division?: string;
  district?: string;
  credits?: number;
  hiddenCredits?: number;
  isScorePublic?: boolean;
  isProfilePublic?: boolean;
  email?: string;
  earnedPublicIncentive?: boolean;
  education?: string;
  occupation?: string;
  bio?: string;
  skills?: string;
  achievements?: string;
  profilePicture?: string;
  name?: string;
  gender?: string;
  birthday?: string;
  birthday_privacy?: 'public' | 'friends' | 'private';
  school?: string;
  class?: string;
  religion?: string;
  privacy_messages?: 'public' | 'friends' | 'friend_of_friend';
  banned?: number;
  ban_appeal_status?: 'none' | 'pending' | 'rejected' | 'accepted';
  verified_badge?: number;
  account_health?: number;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, user: any) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUsageLocally: (tokens: number, secondsUsedParam?: number) => void;
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
    const token = (localStorage.getItem('auth_token') || '').replace(/[^\x20-\x7E]/g, '').trim();
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${String(token || '').replace(/[^\x20-\x7E]/g, '').trim()}` }
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

    // Set up rapid background sync of user profile (including credits)
    // Runs every 4 seconds when the browser/tab is active
    const syncInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const t = (localStorage.getItem('auth_token') || '').replace(/[^\x20-\x7E]/g, '').trim();
        if (t) {
          fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${t}` }
          })
          .then(res => {
            if (res.ok) return res.json();
            throw new Error('Invalid');
          })
          .then(data => {
            setUser(prev => {
              if (!prev) return { ...data, token: t };
              // preserve token
              return { ...prev, ...data };
            });
          })
          .catch(() => {});
        }
      }
    }, 4000);

    return () => {
      clearInterval(syncInterval);
    };
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
    const token = (localStorage.getItem('auth_token') || '').replace(/[^\x20-\x7E]/g, '').trim();
    if (token) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${String(token || '').replace(/[^\x20-\x7E]/g, '').trim()}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(prev => {
            if (!prev) return { ...data, token };
            return { ...prev, ...data };
          });
        }
      } catch(e) { console.error(e) }
    }
  };

  useEffect(() => {
    (window as any).refreshUserCredits = refreshUser;
    return () => {
      delete (window as any).refreshUserCredits;
    };
  }, [user?.token]);

  const updateUsageLocally = (tokens: number, secondsUsedParam?: number) => {
    const secs = secondsUsedParam ?? tokens; // backwards compatible
    setUser(prev => {
      if (!prev) return prev;
      const newTimeLeft = Math.max(0, prev.timeLeft - tokens);
      const prevCredits = prev.credits ?? 600;
      return { 
        ...prev, 
        timeLeft: newTimeLeft, 
        credits: Math.max(0, prevCredits - tokens),
        chatTimeUsed: (prev.chatTimeUsed || 0) + secs 
      };
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, updateUsageLocally }}>
      {children}
    </AuthContext.Provider>
  );
};
