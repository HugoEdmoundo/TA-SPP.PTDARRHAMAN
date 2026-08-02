import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Role } from '../types';
import { api } from '../api/client';
import { normalizeRole } from '../utils/role';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('spp_token');
    const storedUser = localStorage.getItem('spp_user');

    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        parsed.role = normalizeRole(parsed.role);
        setToken(storedToken);
        setUser(parsed);
      } catch {
        localStorage.removeItem('spp_token');
        localStorage.removeItem('spp_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      // Real Live API Authentication
      const res = await api.post('/auth/login', { username, password });
      const data = res.data;
      const upperRole = normalizeRole(data.role);

      const loggedInUser: User = {
        id: Number(data.user_id),
        name: data.full_name || data.username,
        full_name: data.full_name || data.username,
        username: data.username,
        email: data.username,
        role: upperRole as Role,
        phone: data.phone || '',
      };

      setUser(loggedInUser);
      setToken(data.access_token);
      localStorage.setItem('spp_token', data.access_token);
      localStorage.setItem('spp_user', JSON.stringify(loggedInUser));
      return loggedInUser;
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Username atau password salah.';
      throw new Error(detail, { cause: err });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('spp_token');
    localStorage.removeItem('spp_user');
    window.location.href = '/login';
  };

  const hasRole = (roles: Role[]) => {
    if (!user) return false;
    return roles.includes(normalizeRole(user.role));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user && !!token,
        hasRole,
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
