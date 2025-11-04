import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import i18n from "@/lib/i18n";
import { NotificationListener } from "@/components/NotificationListener";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import RoleSelection from "./pages/RoleSelection";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const OAuthHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, loading } = useAuth();

  useEffect(() => {
    if (location.hash && (location.hash.includes('access_token') || location.hash.includes('provider_token'))) {
      sessionStorage.setItem('oauth_callback', 'true');
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.hash, location.pathname]);

  useEffect(() => {
    const wasOAuthCallback = sessionStorage.getItem('oauth_callback');
    
    if (wasOAuthCallback && user && !loading) {
      sessionStorage.removeItem('oauth_callback');
      if (userRole) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/role-selection', { replace: true });
      }
    }
  }, [user, userRole, loading, navigate]);

  // Handle direct navigation when user becomes available (non-OAuth flow)
  useEffect(() => {
    const wasOAuthCallback = sessionStorage.getItem('oauth_callback');
    if (user && !loading && location.pathname === '/' && !wasOAuthCallback) {
      if (userRole) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/role-selection', { replace: true });
      }
    }
  }, [user, userRole, loading, location.pathname, navigate]);

  return null;
};

const App = () => (
  <I18nextProvider i18n={i18n}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationListener />
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <OAuthHandler />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/role-selection" element={<RoleSelection />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </I18nextProvider>
);

export default App;
