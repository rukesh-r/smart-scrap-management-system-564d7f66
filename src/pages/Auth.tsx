import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Navigate, useLocation } from 'react-router-dom';
import { Recycle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { config } from '@/lib/config';
import TwoFactorVerify from '@/components/auth/TwoFactorVerify';
import { motion } from 'framer-motion';
import AnimatedCard from '@/components/animations/AnimatedCard';
import AnimatedInput from '@/components/animations/AnimatedInput';
import AnimatedButton from '@/components/animations/AnimatedButton';

const Auth = () => {
  const { user, signUp, signIn, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{ factorId: string; challengeId: string } | null>(null);
  const location = useLocation();

  // Check for OAuth errors in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
      toast({
        title: 'Authentication Error',
        description: errorDescription || 'Failed to authenticate with Google. Please try again.',
        variant: 'destructive',
      });
      // Clean up URL
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  // Show 2FA verification screen
  if (showTwoFactor && twoFactorData) {
    return (
      <TwoFactorVerify
        factorId={twoFactorData.factorId}
        challengeId={twoFactorData.challengeId}
        onSuccess={() => {
          setShowTwoFactor(false);
          setTwoFactorData(null);
        }}
        onCancel={() => {
          setShowTwoFactor(false);
          setTwoFactorData(null);
        }}
      />
    );
  }

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    // Validate Gmail
    if (!email.endsWith('@gmail.com')) {
      toast({
        title: 'Invalid Email',
        description: 'Only Gmail addresses are allowed.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Account created successfully! Please check your email to verify your account.',
      });
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if 2FA is required
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.find(f => f.status === 'verified');

      if (totpFactor) {
        // Create a challenge for 2FA
        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
          factorId: totpFactor.id,
        });

        if (challengeError) throw challengeError;

        // Sign out temporarily and show 2FA screen
        await supabase.auth.signOut({ scope: 'local' });
        setTwoFactorData({
          factorId: totpFactor.id,
          challengeId: challengeData.id,
        });
        setShowTwoFactor(true);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    
    if (error) {
      toast({
        title: 'Google Sign-In Error',
        description: error.message || 'Failed to sign in with Google. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
    // If successful, page will redirect to Google OAuth
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetLoading(true);

    if (!resetEmail.endsWith('@gmail.com')) {
      toast({
        title: 'Invalid Email',
        description: 'Only Gmail addresses are allowed.',
        variant: 'destructive',
      });
      setResetLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Password reset link sent to your email. Please check your inbox.',
      });
      setResetDialogOpen(false);
      setResetEmail('');
    }
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      
      <AnimatedCard className="w-full max-w-md relative z-10">
        <Card className="bg-white border border-gray-200 shadow-2xl">
          <CardHeader className="text-center">
            <motion.div 
              className="flex items-center justify-center mb-4"
              initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, type: "spring", stiffness: 100 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              >
                <Recycle className="h-8 w-8 text-primary mr-2" />
              </motion.div>
              <motion.span 
                className="text-2xl font-bold text-foreground"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                EcoScrap
              </motion.span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <CardTitle>Welcome to Smart Scrap Management</CardTitle>
              <CardDescription className="text-black">
                Join our marketplace to buy and sell recyclable materials
              </CardDescription>
            </motion.div>
          </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <AnimatedInput
                  id="signin-email"
                  name="email"
                  type="email"
                  placeholder="your.email@gmail.com"
                  pattern=".*@gmail\.com$"
                  label="Gmail Address"
                  delay={0.2}
                  required
                />
                <p className="text-xs text-black ml-1">
                  Only Gmail addresses are accepted
                </p>
                
                <AnimatedInput
                  id="signin-password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  label="Password"
                  delay={0.4}
                  required
                />
                <div className="flex items-center justify-between">
                  <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="link" className="px-0 text-sm">
                        Forgot Password?
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                          Enter your email address and we'll send you a link to reset your password.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reset-email">Gmail Address</Label>
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="your.email@gmail.com"
                            pattern=".*@gmail\.com$"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                          />
                          <p className="text-xs text-black">
                            Only Gmail addresses are accepted
                          </p>
                        </div>
                        <AnimatedButton type="submit" className="w-full" disabled={resetLoading} delay={0.2}>
                          {resetLoading ? 'Sending...' : 'Send Reset Link'}
                        </AnimatedButton>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <AnimatedButton 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                  delay={0.8}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </AnimatedButton>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-black">Or continue with</span>
                  </div>
                </div>
                
                <AnimatedButton 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  delay={1.0}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {loading ? 'Signing in...' : 'Continue with Google'}
                </AnimatedButton>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <AnimatedInput
                  id="signup-fullname"
                  name="fullName"
                  placeholder="Enter your full name"
                  label="Full Name"
                  delay={0.2}
                  required
                />
                
                <AnimatedInput
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="your.email@gmail.com"
                  pattern=".*@gmail\.com$"
                  title="Please use a Gmail address"
                  label="Gmail Address"
                  delay={0.4}
                  required
                />
                <p className="text-xs text-black ml-1">Only Gmail addresses are accepted</p>
                
                <AnimatedInput
                  id="signup-password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  label="Password"
                  delay={0.6}
                  required
                />
                
                <AnimatedButton 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                  delay={0.8}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </AnimatedButton>
              </form>
            </TabsContent>
          </Tabs>
          </CardContent>
        </Card>
      </AnimatedCard>
    </div>
  );
};

export default Auth;