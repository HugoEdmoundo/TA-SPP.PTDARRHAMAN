import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Role } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, role: Role) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default mock users for instant demonstration and development without backend running
const MOCK_USERS: Record<string, User> = {
  'admin@ptdarrahman.sch.id': {
    id: 'usr-admin-001',
    name: 'Ustadz Ahmad Fauzi (Admin)',
    email: 'admin@ptdarrahman.sch.id',
    role: 'ADMIN',
    phone: '081234567890',
  },
  'wali@ptdarrahman.sch.id': {
    id: 'usr-wali-001',
    name: 'Bapak H. Hendro Sugiono (Wali Santri)',
    email: 'wali@ptdarrahman.sch.id',
    role: 'WALI',
    phone: '081987654321',
  },
  'superadmin@ptdarrahman.sch.id': {
    id: 'usr-superadmin-001',
    name: 'K.H. Abdullah Syafi\'i (Superadmin)',
    email: 'superadmin@ptdarrahman.sch.id',
    role: 'SUPERADMIN',
    phone: '08111222333',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from storage on mount
    const storedToken = localStorage.getItem('spp_token');
    const storedUser = localStorage.getItem('spp_user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('spp_token');
        localStorage.removeItem('spp_user');
      }
    } else {
      // Auto-login default admin for smooth immediate demo if nothing in localStorage
      const defaultUser = MOCK_USERS['admin@ptdarrahman.sch.id'];
      setUser(defaultUser);
      setToken('mock-jwt-token-admin');
      localStorage.setItem('spp_token', 'mock-jwt-token-admin');
      localStorage.setItem('spp_user', JSON.stringify(defaultUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, role: Role) => {
    setIsLoading(true);
    try {
      // Try backend call if available, fallback to mock user
      let loggedUser: User;
      let authToken = `token-${role.toLowerCase()}-${Date.now()}`;

      try {
        const res = await api.post('/auth/login', { email, role });
        loggedUser = res.data.user;
        authToken = res.data.token;
      } catch {
        // Fallback for demo/offline resilience
        loggedUser = MOCK_USERS[email] || {
          id: `usr-${Date.now()}`,
          name: email.split('@')[0].toUpperCase(),
          email,
          role,
          phone: '081234567890',
        };
      }

      setUser(loggedUser);
      setToken(authToken);
      localStorage.setItem('spp_token', authToken);
      localStorage.setItem('spp_user', JSON.stringify(loggedUser));
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
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
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
