import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, DemoAccount, RegisterPayload } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterPayload) => Promise<void>;
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
      const isExplicitlyLoggedOut = localStorage.getItem('adr_explicitly_logged_out') === 'true';
      const token = localStorage.getItem('adr_auth_token');
      
      if (token && !isExplicitlyLoggedOut) {
        try {
          const me = await api.getMe();
          setUser(me);
        } catch (err) {
          api.setToken(null);
          setUser(null);
        }
      } else if (!isExplicitlyLoggedOut) {
        // Automatically sign in with default physician for seamless initial preview
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
    localStorage.removeItem('adr_explicitly_logged_out');
    const res = await api.login({ username, password });
    setUser(res.user);
  };

  const register = async (userData: RegisterPayload) => {
    localStorage.removeItem('adr_explicitly_logged_out');
    await api.register(userData);
    // After successful registration, log in
    const res = await api.login({ username: userData.username, password: userData.password });
    setUser(res.user);
  };

  const loginWithDemo = async (demo: DemoAccount) => {
    localStorage.removeItem('adr_explicitly_logged_out');
    const res = await api.login({ username: demo.username, password: demo.password });
    setUser(res.user);
  };

  const logout = () => {
    localStorage.setItem('adr_explicitly_logged_out', 'true');
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
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
