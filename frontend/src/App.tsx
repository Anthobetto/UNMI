import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Switch, Route, Redirect } from 'wouter';
import { HelmetProvider } from 'react-helmet-async';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from '@/components/nav/sidebar';
import { Header } from '@/components/nav/header';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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

function Router() {
  const { isLoading, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/auth" component={AuthPage} />
        <Route><Redirect to="/" /></Route>
      </Switch>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Sidebar - FichajeSimple Style */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {/* Header - FichajeSimple Style */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Content */}
        <main className="flex-1">
          <div className="mx-auto max-w-[1600px] p-4 md:p-6 lg:p-8">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/rentabilidad-unmi" component={RentabilidadUNMI} />
              <Route path="/telefonia" component={Telefonia} />
              <Route path="/templates" component={Templates} />
              <Route path="/chatbots" component={Chatbots} />
              <Route path="/locations" component={Locations} />
              <Route path="/plan" component={Plan} />
              <Route path="/auth"><Redirect to="/dashboard" /></Route>
              <Route>
                <div className="p-6 text-center mt-20">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p>Page not found</p>
                  <a href="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</a>
                </div>
              </Route>
            </Switch>
          </div>
        </main>
      </div>
    </div>
  );
}

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
