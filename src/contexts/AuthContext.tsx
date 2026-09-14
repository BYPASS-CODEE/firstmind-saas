import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, ApiError } from '../services/api';
import { User, UserSubscription } from '../types';

interface AuthContextType {
  user: User | null;
  subscription: UserSubscription | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDevTest: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, referralCode?: string) => Promise<void>;
  enterDevTest: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDevTest, setIsDevTest] = useState<boolean>(() => {
    return localStorage.getItem('firstmind_dev_test') === 'true';
  });

  const refreshUser = async () => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setSubscription(null);
      setIsDevTest(false);
      localStorage.removeItem('firstmind_dev_test');
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      setSubscription(res.subscription);
      if (res.user?.id === 'usr_dev_test' || localStorage.getItem('firstmind_dev_test') === 'true') {
        setIsDevTest(true);
      }
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'UNAUTHENTICATED' || err.code === 'UNAUTHORIZED')) {
        api.setToken(null);
        setUser(null);
        setSubscription(null);
        setIsDevTest(false);
        localStorage.removeItem('firstmind_dev_test');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setIsDevTest(false);
    localStorage.removeItem('firstmind_dev_test');
    try {
      await api.login({ email, password });
      await refreshUser();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, referralCode?: string) => {
    setIsLoading(true);
    setIsDevTest(false);
    localStorage.removeItem('firstmind_dev_test');
    try {
      await api.register({ name, email, password, referralCode });
      await refreshUser();
    } finally {
      setIsLoading(false);
    }
  };

  const enterDevTest = async () => {
    setIsLoading(true);
    try {
      const res = await api.enterDevTestSession();
      localStorage.setItem('firstmind_dev_test', 'true');
      setIsDevTest(true);
      if (res.user) {
        setUser(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
    } catch {
      // Ignored
    } finally {
      setUser(null);
      setSubscription(null);
      setIsDevTest(false);
      localStorage.removeItem('firstmind_dev_test');
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        isLoading,
        isAuthenticated: !!user,
        isDevTest,
        login,
        register,
        enterDevTest,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
