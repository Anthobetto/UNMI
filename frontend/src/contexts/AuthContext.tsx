// Auth Context - Gestión centralizada de autenticación con validación y estado global

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { z } from 'zod';

// --- Tipos base (pueden venir del shared/schema o definirse aquí) ---
export interface User {
  id: string;
  username: string;
  email: string;
  planType: 'templates' | 'chatbots' | null;
   companyName?: string; 
}

// --- Esquemas de validación ---
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  companyName: z.string().min(1, 'Company name is required'),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

export type RegisterData = z.infer<typeof registerSchema>;

// --- Contexto principal ---
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

      const response = await fetch('/api/user', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        localStorage.removeItem('accessToken');
        setUser(null);
        return;
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error('Auth init error:', err);
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

      const parsed = loginSchema.parse(credentials);

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }

      const profileResponse = await fetch('/api/user', {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      });

      const profileData = await profileResponse.json();
      setUser(profileData.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setError(null);
      setIsLoading(true);

      const parsed = registerSchema.parse(data);

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      return { url: result.url };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      localStorage.removeItem('accessToken');
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      throw new Error(message);
    }
  };

  const updateUserPlan = async (planType: 'templates' | 'chatbots') => {
    if (!user) throw new Error('No user logged in');
    const token = localStorage.getItem('accessToken');

    const response = await fetch('/api/user/plan', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ planType }),
    });

    if (!response.ok) throw new Error('Failed to update plan');
    setUser((prev) => (prev ? { ...prev, planType } : null));
  };

  const hasAccessToSection = (section: string): boolean => {
    if (!user) return false;
    const commonSections = ['dashboard', 'locations', 'plan'];
    if (commonSections.includes(section)) return true;

    const accessRules: Record<string, string[]> = {
      templates: ['templates', 'rentabilidad', 'telefonia'],
      chatbots: ['chatbots', 'rentabilidad', 'telefonia'],
    };

    const plan = user.planType || 'templates';
    return accessRules[plan]?.includes(section) ?? false;
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
