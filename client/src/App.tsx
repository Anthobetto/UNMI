import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Locations from "@/pages/locations";
import Templates from "@/pages/templates";
import Contents from "@/pages/contents";
import Pricing from "@/pages/pricing";
import Subscription from "@/pages/subscription";
import NotFound from "@/pages/not-found";

function Router() {
  const { isLoading, user } = useAuth();

  // Show a simple loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  // If no user is logged in, only show auth page and redirect all other routes to it
  if (!user) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route>
          <Redirect to="/auth" />
        </Route>
      </Switch>
    );
  }

  // If user is logged in, show all routes
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/auth">
        <Redirect to="/" />
      </Route>
      <Route path="/subscription" component={Subscription} />
      <Route path="/locations" component={Locations} />
      <Route path="/templates" component={Templates} />
      <Route path="/contents" component={Contents} />
      <Route path="/pricing" component={Pricing} />
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