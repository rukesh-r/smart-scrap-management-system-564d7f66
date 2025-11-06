import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { config } from '@/lib/config';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'customer' | 'buyer' | 'admin';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRole: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await Promise.race([
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]) as any;

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile | null;
    } catch (error) {
      console.error('Profile fetch timeout or error:', error);
      return null;
    }
  };

  const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      const { data, error } = await Promise.race([
        supabase.from('user_roles').select('*').eq('user_id', userId).maybeSingle(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]) as any;

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      return data as UserRole | null;
    } catch (error) {
      console.error('User role fetch timeout or error:', error);
      return null;
    }
  };

  const refreshUserRole = async () => {
    if (!user) return;
    const role = await fetchUserRole(user.id);
    setUserRole(role);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          if (event === 'SIGNED_IN') {
            supabase.from('login_history').insert({
              user_id: session.user.id,
              user_agent: navigator.userAgent,
              login_method: session.user.app_metadata.provider || 'email',
              success: true
            }).then(({ error }) => {
              if (error) console.error('Login tracking error:', error);
            });
          }
          
          setLoading(false);
          Promise.all([
            fetchProfile(session.user.id),
            fetchUserRole(session.user.id)
          ]).then(([profileData, roleData]) => {
            setProfile(profileData);
            setUserRole(roleData);
          });
        } else {
          setProfile(null);
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        Promise.all([
          fetchProfile(session.user.id),
          fetchUserRole(session.user.id)
        ]).then(([profileData, roleData]) => {
          setProfile(profileData);
          setUserRole(roleData);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${config.getRedirectUrl()}${config.oauth.successPath}`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
    return { error };
  };

  const signOut = async () => {
    try {
      // Log logout time for the most recent active session
      if (user?.id) {
        const { data: activeSession } = await supabase
          .from('login_history')
          .select('id')
          .eq('user_id', user.id)
          .is('logout_timestamp', null)
          .order('login_timestamp', { ascending: false })
          .limit(1)
          .single();

        if (activeSession) {
          await supabase
            .from('login_history')
            .update({ logout_timestamp: new Date().toISOString() })
            .eq('id', activeSession.id);
        }
      }
      
      // Clear local state immediately
      setUser(null);
      setSession(null);
      setProfile(null);
      setUserRole(null);
      
      // Attempt to sign out from Supabase (ignore errors if session expired)
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      // Silently handle errors - state is already cleared
      console.log('Logout completed');
    }
  };

  const value = {
    user,
    session,
    profile,
    userRole,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshUserRole,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
