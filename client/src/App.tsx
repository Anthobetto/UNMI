import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Locations from "@/pages/locations";
import Templates from "@/pages/templates";
import Contents from "@/pages/contents";
import Pricing from "@/pages/pricing";
import Subscription from "@/pages/subscription";
import NotFound from "@/pages/not-found";

function Router() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/subscription" component={Subscription} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/locations" component={Locations} />
      <ProtectedRoute path="/templates" component={Templates} />
      <ProtectedRoute path="/contents" component={Contents} />
      <ProtectedRoute path="/pricing" component={Pricing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;