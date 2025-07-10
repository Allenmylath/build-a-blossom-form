
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { LogIn, UserPlus, Mail, Lock, Zap, Shield, Users, BarChart3 } from 'lucide-react';

interface AuthProps {
  onAuthChange: (user: User | null) => void;
}

export const Auth = ({ onAuthChange }: AuthProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        onAuthChange(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      onAuthChange(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [onAuthChange]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your registration.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "Google sign in failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md mx-auto animate-fade-in">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Welcome Back!</h2>
              <p className="text-muted-foreground mt-2">{user.email}</p>
            </div>
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              Sign Out
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-neue">
      {/* Main Container */}
      <div className="min-h-screen flex">
        
        {/* Left Side - Branding & Content */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 to-blue-600 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
            <div className="absolute top-40 right-20 w-20 h-20 bg-white rounded-full"></div>
            <div className="absolute bottom-20 left-20 w-24 h-24 bg-white rounded-full"></div>
            <div className="absolute bottom-40 right-10 w-16 h-16 bg-white rounded-full"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <div className="space-y-8">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-500" />
                </div>
                <span className="text-2xl font-bold">ModFormz</span>
              </div>
              
              {/* New Tagline & Description */}
              <div className="space-y-6">
                <h1 className="text-4xl font-bold leading-tight">
                  Conversations that
                  <br />
                  <span className="text-blue-200">convert</span>
                </h1>
                <p className="text-xl text-blue-100 leading-relaxed max-w-md">
                  Transform boring forms into intelligent conversations. 
                  Boost engagement by 300% with AI-powered interactions.
                </p>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-6 pt-8">
                <div>
                  <div className="text-3xl font-bold">10,000+</div>
                  <div className="text-blue-200 text-sm">Forms created</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">300%</div>
                  <div className="text-blue-200 text-sm">Higher engagement</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">99.9%</div>
                  <div className="text-blue-200 text-sm">Uptime</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-blue-200 text-sm">Happy customers</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Authentication */}
        <div className="w-full lg:w-1/2 flex flex-col">
          {/* Mobile Header */}
          <div className="lg:hidden bg-blue-500 text-white px-6 py-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-xl font-bold">ModFormz</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Conversations that convert</h1>
            <p className="text-blue-100">Transform forms into intelligent conversations</p>
          </div>

          {/* Auth Form Container */}
          <div className="flex-1 flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-sm">
              
              {/* Welcome Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-black mb-2">Welcome</h2>
                <p className="text-gray-600">Choose your preferred sign-in method</p>
              </div>

              {/* Auth Tabs */}
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 border border-gray-300 rounded-2xl p-1 h-12">
                  <TabsTrigger 
                    value="signin" 
                    className="rounded-xl font-medium text-sm data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    className="rounded-xl font-medium text-sm data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-5">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-sm font-medium text-black">
                        Email
                      </Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11 text-sm border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                        style={{
                          borderColor: '#e5e7eb',
                          '--tw-ring-color': 'rgb(59 130 246 / 0.5)',
                          '--tw-ring-offset-color': '#fff'
                        } as React.CSSProperties}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-sm font-medium text-black">
                        Password
                      </Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 text-sm border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                        style={{
                          borderColor: '#e5e7eb',
                          '--tw-ring-color': 'rgb(59 130 246 / 0.5)',
                          '--tw-ring-offset-color': '#fff'
                        } as React.CSSProperties}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 font-medium text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-xl border-0 shadow-sm mt-6" 
                      disabled={loading}
                    >
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 text-gray-500 font-medium">or</span>
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-11 font-medium text-sm border-gray-300 rounded-xl hover:bg-gray-50" 
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </TabsContent>

                <TabsContent value="signup" className="space-y-5">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium text-black">
                        Email
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11 text-sm border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                        style={{
                          borderColor: '#e5e7eb',
                          '--tw-ring-color': 'rgb(59 130 246 / 0.5)',
                          '--tw-ring-offset-color': '#fff'
                        } as React.CSSProperties}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium text-black">
                        Password
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="h-11 text-sm border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                        style={{
                          borderColor: '#e5e7eb',
                          '--tw-ring-color': 'rgb(59 130 246 / 0.5)',
                          '--tw-ring-offset-color': '#fff'
                        } as React.CSSProperties}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 font-medium text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-xl border-0 shadow-sm mt-6" 
                      disabled={loading}
                    >
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 text-gray-500 font-medium">or</span>
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-11 font-medium text-sm border-gray-300 rounded-xl hover:bg-gray-50" 
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </TabsContent>
              </Tabs>

              {/* Footer Links */}
              <div className="text-center mt-8 space-y-2">
                <p className="text-xs text-gray-500">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
                <div className="flex justify-center space-x-4 text-xs text-gray-400">
                  <span>Help</span>
                  <span>•</span>
                  <span>Privacy</span>
                  <span>•</span>
                  <span>Terms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
