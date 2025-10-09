/**
 * AuthService - Single Responsibility Principle
 * Handles ONLY authentication operations (login, register, logout, session)
 * Separated from payment/navigation logic for testability
 */

import { supabase } from '@/lib/supabase';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  companyName: string;
  termsAccepted: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  companyName: string;
  auth_id: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

/**
 * Auth Service - Abstracción de autenticación
 * Dependency Inversion: Puede ser mockeado para testing
 */
export class AuthService {
  /**
   * Login con email y password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.message || 'Invalid credentials');
    }

    return res.json();
  }

  /**
   * Register (retorna URL de Stripe Checkout)
   * Nota: El paywall se maneja en PaywallService
   */
  async initiateRegistration(credentials: RegisterCredentials): Promise<{ url: string; tempUserId: string }> {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.message || 'Registration failed');
    }

    return res.json();
  }

  /**
   * Obtener usuario autenticado
   */
  async getCurrentUser(token: string): Promise<AuthUser | null> {
    const res = await fetch('/api/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return null;

    const json = await res.json();
    if (!json.user) return null;

    // Mapper: company_name → companyName
    return {
      ...json.user,
      companyName: json.user.company_name,
    };
  }

  /**
   * Logout (solo limpia sesión servidor)
   */
  async logout(): Promise<void> {
    const res = await fetch('/api/logout', { method: 'POST' });
    if (!res.ok) {
      throw new Error('Logout failed');
    }
  }

  /**
   * Guardar token en localStorage
   */
  saveToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  /**
   * Obtener token desde localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Eliminar token
   */
  clearToken(): void {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
  }
}

// Singleton instance
export const authService = new AuthService();

