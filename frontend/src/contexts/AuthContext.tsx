// Auth Context - Gestión centralizada de autenticación con validación y estado global

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { z } from 'zod';

// --- Tipos base ---
export interface User {
  id: string;
  authId: string; 
  username: string;
  email: string;
  companyName: string;
  planType: 'small' | 'pro' | 'premium' | null; 
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled';
  
  numPhones?: number;  
  maxMessages?: number; 
  credits?: Record<string, number>;
}

// --- Esquemas de validación ---
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  companyName: z.string().min(1, 'Requerido'),
  termsAccepted: z.boolean().refine(val => val === true),
  selections: z.array(z.object({
    planType: z.enum(['small', 'pro', 'premium']),
    quantity: z.number().min(1), // Esto mapea a líneas/sedes
    departments: z.number().optional(), // Mapea a departments_count
    price: z.number().optional()
  })).min(1),
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
  updateUserPlan: (planType: 'templates' | 'chatbots' | 'small' | 'pro') => Promise<void>;
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
      // Mantenemos tu lógica original de errores
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

      // Si el backend ya devolvió el usuario completo, lo usamos directamente
      if (data.user) {
        setUser(data.user);
      } else {
        // Fallback: solo si el backend no devolvió el usuario (por seguridad)
        const profileResponse = await fetch('/api/user', {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUser(profileData.user);
        }
      }
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

      console.log("🚀 Enviando registro:", data); // Log para verificar que llega 'small'

      // Validamos con el schema actualizado que YA acepta 'small'
      const parsed = registerSchema.parse(data);

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      if (!response.ok) {
        // Manejo de error si devuelve HTML (por si acaso)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") === -1) {
             throw new Error("Error de conexión: El servidor no devolvió JSON.");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      return { url: result.url };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      console.error("❌ Error en registro:", message);
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

  // ✅ Actualizado tipado aquí también
  const updateUserPlan = async (planType: 'templates' | 'chatbots' | 'small' | 'pro') => {
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
    // @ts-ignore - Forzamos actualización local
    setUser((prev) => (prev ? { ...prev, planType } : null));
  };

  const hasAccessToSection = (section: string): boolean => {
    if (!user) return false;
    const commonSections = ['dashboard', 'locations', 'plan'];
    if (commonSections.includes(section)) return true;

    const accessRules: Record<string, string[]> = {
      // ✅ Compatibilidad total (antiguo + nuevo)
      templates: ['templates', 'rentabilidad', 'telefonia'],
      small:     ['templates', 'rentabilidad', 'telefonia'],
      
      chatbots: ['chatbots', 'rentabilidad', 'telefonia'],
      pro:      ['chatbots', 'rentabilidad', 'telefonia'],
    };

    const plan = user.planType || 'small';
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