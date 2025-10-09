/**
 * App.tsx - Main Application Router
 * Implementa routing completo con guards y layouts
 * Seguir principios SOLID: SRP para routing, OCP para nuevas rutas
 * 
 * i18n: Multi-language support (ES, EN, FR)
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { Switch, Route, Redirect } from 'wouter';
import { HelmetProvider } from 'react-helmet-async';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from '@/components/nav/sidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// i18n Configuration
import '@/i18n/config';

// Pages
import LandingPage from '@/pages/LandingPage';
import AuthPage from '@/pages/AuthPage';
import Dashboard from '@/pages/Dashboard';
import RentabilidadUNMI from '@/pages/RentabilidadUNMI';
import Telefonia from '@/pages/Telefonia';
import Templates from '@/pages/Templates';
import Chatbots from '@/pages/Chatbots';
import Locations from '@/pages/Locations';
import Plan from '@/pages/Plan';

/**
 * Router Component - Maneja lógica de routing y guards
 */
function Router() {
  const { isLoading, user } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-3 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated routes - Solo rutas esenciales
  if (!user) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/auth" component={AuthPage} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    );
  }

  // Authenticated routes with layout - Una sola ruta por funcionalidad
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <Switch>
          {/* Core Features */}
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/rentabilidad-unmi" component={RentabilidadUNMI} />
          <Route path="/telefonia" component={Telefonia} />
          <Route path="/templates" component={Templates} />
          <Route path="/chatbots" component={Chatbots} />
          <Route path="/locations" component={Locations} />
          <Route path="/plan" component={Plan} />

          {/* Redirects for authenticated users */}
          <Route path="/auth">
            <Redirect to="/dashboard" />
          </Route>

          {/* 404 - Not Found */}
          <Route>
            <div className="p-6 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600 mb-6">Page not found</p>
              <a 
                href="/dashboard" 
                className="text-blue-600 hover:underline"
              >
                Back to Dashboard
              </a>
            </div>
          </Route>
        </Switch>
      </div>
    </div>
  );
}

/**
 * Main App Component
 */
function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;

