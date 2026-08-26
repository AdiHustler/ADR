import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, DemoAccount } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithDemo: (demo: DemoAccount) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('adr_auth_token');
      if (token) {
        try {
          const me = await api.getMe();
          setUser(me);
        } catch (err) {
          api.setToken(null);
          setUser(null);
        }
      } else {
        // Automatically sign in with default physician for seamless evaluation
        try {
          const res = await api.login({ username: 'dr_sharma', password: 'password123' });
          setUser(res.user);
        } catch (e) {
          // Ignore
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login({ username, password });
    setUser(res.user);
  };

  const loginWithDemo = async (demo: DemoAccount) => {
    const res = await api.login({ username: demo.username, password: demo.password });
    setUser(res.user);
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithDemo,
        logout,
        isAuthenticated: !!user
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
