import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import { Login } from "@/pages/login";
import { Dashboard } from "@/pages/dashboard";
import { Products } from "@/pages/products";
import { Orders } from "@/pages/orders";
import { Categories } from "@/pages/categories";
import { Settings } from "@/pages/settings";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: any }) {
  const [location, setLocation] = useLocation();
  const isAuthenticated = !!localStorage.getItem("adminKey");

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;
  return <Component />;
}

function Router() {
  const [location, setLocation] = useLocation();
  const isAuthenticated = !!localStorage.getItem("adminKey");

  useEffect(() => {
    if (isAuthenticated && location === "/") {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, location, setLocation]);

  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/products"><ProtectedRoute component={Products} /></Route>
      <Route path="/orders"><ProtectedRoute component={Orders} /></Route>
      <Route path="/categories"><ProtectedRoute component={Categories} /></Route>
      <Route path="/settings"><ProtectedRoute component={Settings} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
