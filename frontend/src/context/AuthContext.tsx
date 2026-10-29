import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAuth } from '../types';
import { getAuthToken, getStoredUser, setAuthToken, setStoredUser, clearAuthToken, apiRequest } from '../services/api';

interface AuthContextType {
  user: UserAuth | null;
  token: string | null;
  role: 'admin' | 'volunteer' | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserAuth) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAuth | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest('/auth/me');
        if (data.success && data.user) {
          setUser(data.user);
          setStoredUser(data.user);
        } else {
          clearAuthToken();
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        clearAuthToken();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  const login = (newToken: string, newUser: UserAuth) => {
    setAuthToken(newToken);
    setStoredUser(newUser);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    clearAuthToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user ? user.role : null,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        loading,
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
