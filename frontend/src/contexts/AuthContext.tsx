// Auth Context - Gestión centralizada de autenticación con acceso condicional
// Implementa SRP (Single Responsibility) para auth state management

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import type { User, LoginData, RegisterData } from '../../../shared/schema';
import { stripeMockService } from '@/services/StripeMockService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<{ url: string }>;
  logout: () => Promise<void>;
  updateUserPlan: (planType: 'templates' | 'chatbots') => Promise<void>;
  hasAccessToSection: (section: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setUser(null);
        return;
      }

      // Fetch current user from API
      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem('accessToken');
        setUser(null);
        return;
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error('Auth initialization error:', err);
      setError('Failed to initialize authentication');
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginData) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }

      // Fetch user profile
      const profileResponse = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${data.accessToken}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const profileData = await profileResponse.json();
      setUser(profileData.user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      
      // El backend debe devolver { url, tempUserId }
      // El usuario será creado después del pago exitoso
      return { url: result.url };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      
      await fetch('/api/logout', {
        method: 'POST',
      });

      localStorage.removeItem('accessToken');
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateUserPlan = async (planType: 'templates' | 'chatbots') => {
    try {
      if (!user) throw new Error('No user logged in');

      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/user/plan', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ planType }),
      });

      if (!response.ok) {
        throw new Error('Failed to update plan');
      }

      setUser(prev => prev ? { ...prev, planType } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update plan';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const hasAccessToSection = (section: string): boolean => {
    if (!user) return false;

    // Sections accessible by all authenticated users
    const commonSections = ['dashboard', 'locations', 'plan'];
    if (commonSections.includes(section)) return true;

    // Plan-specific sections
    const accessRules: Record<string, string[]> = {
      'templates': ['templates', 'rentabilidad', 'telefonia'],
      'chatbots': ['chatbots', 'rentabilidad', 'telefonia'],
    };

    const userPlan = user.planType || 'templates'; // Default to templates
    const allowedSections = accessRules[userPlan] || [];
    
    return allowedSections.includes(section);
  };

  const refreshUser = async () => {
    await initializeAuth();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUserPlan,
    hasAccessToSection,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}




