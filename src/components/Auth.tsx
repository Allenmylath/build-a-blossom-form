
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
      {/* Top Navigation Bar */}
      <nav className="border-b border-gray-300 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-black">ModFormz</span>
            </div>
            <div className="hidden sm:flex items-center space-x-6 text-sm font-medium">
              <span className="text-gray-600">Features</span>
              <span className="text-gray-600">Pricing</span>
              <span className="text-gray-600">Support</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-24">
        {/* Authentication Section - Centered */}
        <div className="max-w-md mx-auto">
          <div className="bg-white border border-gray-300 rounded-2xl shadow-sm p-8">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 border border-gray-300 rounded-xl p-1">
                <TabsTrigger 
                  value="signin" 
                  className="rounded-lg font-medium text-base py-3 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-300"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="rounded-lg font-medium text-base py-3 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-300"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-black mb-2">Welcome back</h2>
                  <p className="text-gray-600">Continue building amazing forms</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm font-medium text-black">
                      Email address
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 text-base border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/50"
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
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 text-base border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/50"
                      style={{
                        borderColor: '#e5e7eb',
                        '--tw-ring-color': 'rgb(59 130 246 / 0.5)',
                        '--tw-ring-offset-color': '#fff'
                      } as React.CSSProperties}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 font-medium text-base bg-blue-500 hover:bg-blue-600 text-white rounded-xl border-0 shadow-sm mt-6" 
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-4 text-gray-500 font-medium">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-12 font-medium text-base border-gray-300 rounded-xl hover:bg-gray-50" 
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
                    {loading ? "Signing in..." : "Continue with Google"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-black mb-2">Create account</h2>
                  <p className="text-gray-600">Start building intelligent forms today</p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium text-black">
                      Email address
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 text-base border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/50"
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
                      placeholder="Create a password (min. 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-12 text-base border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/50"
                      style={{
                        borderColor: '#e5e7eb',
                        '--tw-ring-color': 'rgb(59 130 246 / 0.5)',
                        '--tw-ring-offset-color': '#fff'
                      } as React.CSSProperties}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 font-medium text-base bg-blue-500 hover:bg-blue-600 text-white rounded-xl border-0 shadow-sm mt-6" 
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-4 text-gray-500 font-medium">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-12 font-medium text-base border-gray-300 rounded-xl hover:bg-gray-50" 
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
                    {loading ? "Signing up..." : "Continue with Google"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500 mb-4">Trusted by creators worldwide</p>
            <div className="flex items-center justify-center space-x-8 text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>10,000+ Forms Created</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>500+ Happy Users</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>99.9% Uptime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Features Section */}
        <div className="mt-24 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
                <BarChart3 className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-semibold text-black text-lg">Advanced Analytics</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Track performance with real-time insights and detailed reporting
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-black text-lg">AI Chat Forms</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Create conversational experiences with intelligent AI interactions
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="font-semibold text-black text-lg">Enterprise Security</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Bank-level encryption with GDPR compliance and data protection
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
