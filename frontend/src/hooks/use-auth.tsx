/**
 * useAuth Hook - Refactored with SOLID principles
 * Uses AuthService and PaywallService instead of inline logic
 */

import { createContext, ReactNode, useContext } from 'react';
import { useQuery, useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { authService, AuthUser, LoginCredentials, RegisterCredentials } from '@/services/AuthService';

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<{ user: AuthUser; accessToken: string }, Error, LoginCredentials>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<{ url: string; tempUserId: string }, Error, RegisterCredentials>;
};

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

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<AuthUser | null>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const token = authService.getToken();
      if (!token) return null;

      return authService.getCurrentUser(token);
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await authService.login(credentials);
      authService.saveToken(response.accessToken);
      return response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user'], data.user);
      toast({
        title: 'Welcome back!',
        description: 'Successfully logged in.',
      });
      navigate('/dashboard');
    },
    onError: (error: Error) => {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      return authService.initiateRegistration(credentials);
    },
    onSuccess: async ({ url }) => {
      toast({
        title: 'Registration initiated',
        description: 'Redirecting to plan selection...',
      });
      // En dev: redirect a choose-plan
      // En prod: window.location.href = url (Stripe Checkout)
      navigate('/choose-plan');
    },
    onError: (error: Error) => {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authService.logout();
    },
    onSuccess: () => {
      authService.clearToken();
      queryClient.setQueryData(['/api/user'], null);
      navigate('/auth');
      toast({
        title: 'Goodbye!',
        description: 'Successfully logged out.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Logout failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error: error ?? null,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
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

