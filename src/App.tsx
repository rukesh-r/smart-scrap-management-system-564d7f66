import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import i18n from "@/lib/i18n";
import { NotificationListener } from "@/components/NotificationListener";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const RoleSelection = lazy(() => import("./pages/RoleSelection"));
const LoginHistory = lazy(() => import("./pages/LoginHistory"));
const NotFound = lazy(() => import("./pages/NotFound"));

const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

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
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/role-selection" element={<RoleSelection />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/login-history" element={<LoginHistory />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </I18nextProvider>
);

export default App;
