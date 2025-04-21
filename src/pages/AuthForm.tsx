'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Mail, Loader2 } from "lucide-react"
import { supabase, testConnection } from "@/lib/supabaseClient"
import { useNavigate } from "react-router-dom"

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<{success: boolean; message: string} | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    checkConnection();
    checkUser();
  }, [])

  const checkConnection = async () => {
    const status = await testConnection();
    setConnectionStatus(status);
    console.log('Connection status:', status);
  }

  const checkUser = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Auth check error:', authError.message);
        return;
      }
      
      if (user) {
        console.log('User found:', user);
        // Check if profile exists and if user is organizer
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile check error:', profileError.message);
          return;
        }

        if (profile) {
          console.log('Profile found:', profile);
          // Store organizer status in localStorage
          localStorage.setItem('isOrganizer', profile.is_organizer ? 'true' : 'false');
          navigate("/")
        }
      }
    } catch (error: any) {
      console.error('Auth check error:', error.message);
    }
  }

  const handleAuth = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!email || !password) {
      setError("Please enter email and password.")
      setLoading(false)
      return
    }

    try {
      if (isLogin) {
        // Login process
        console.log('Attempting login...');
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        })
        if (error) throw error;
        
        if (data.user) {
          console.log('Login successful:', data.user);
          
          // Store user email in localStorage for special access handling
          localStorage.setItem('userEmail', email);
          
          // Check if user is organizer
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

          if (profileError) {
            console.error('Profile check error:', profileError.message);
            
            // Special case for test@organizer.com - set as organizer regardless of profile
            if (email === 'test@organizer.com') {
              localStorage.setItem('isOrganizer', 'true');
              console.log('Set hardcoded organizer status for test@organizer.com');
            }
          } else if (profile) {
            console.log('Profile found:', profile);
            // Store organizer status in localStorage
            localStorage.setItem('isOrganizer', profile.is_organizer ? 'true' : 'false');
            console.log('Set organizer status:', profile.is_organizer);
          } else if (email === 'test@organizer.com') {
            // Backup check for test@organizer.com if no profile exists
            localStorage.setItem('isOrganizer', 'true');
            console.log('Set hardcoded organizer status for test@organizer.com (no profile)');
          }

          navigate("/")
        }
      } else {
        // Signup process
        console.log('Attempting signup...');
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              name: email.split('@')[0]
            }
          }
        })
        
        if (error) {
          console.error('Signup error:', error);
          throw error;
        }

        if (data.user) {
          console.log('Signup successful:', data.user);
          if (data.user.identities?.length === 0) {
            setError("This email is already registered. Please login instead.");
          } else {
            setSuccess("Account created successfully! Please check your email for verification link.");
          }
        } else {
          setError("Failed to create account. Please try again.");
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err.message);
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })
      
      if (error) throw error
      
    } catch (err: any) {
      console.error('Google auth error:', err.message)
      setError(err.message)
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAuth();
    }
  };

  // If there's a connection error, show it
  if (connectionStatus && !connectionStatus.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Card className="w-[400px] bg-black border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Connection Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{connectionStatus.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="w-1/2 bg-[#121212] p-8 flex flex-col justify-between">
        <h1 className="text-2xl font-bold text-white">EventHub</h1>
        <blockquote className="text-white">
          "Join amazing events and connect with like-minded people."
          <footer className="mt-2 font-medium">EventHub Team</footer>
        </blockquote>
      </div>

      {/* Right Panel */}
      <div className="w-1/2 bg-black flex items-center justify-center relative">
        <Button
          variant="outline"
          className="absolute top-8 right-8 text-white border-gray-600 hover:bg-gray-800"
          onClick={() => {
            setIsLogin(!isLogin)
            setEmail("")
            setPassword("")
            setError(null)
            setSuccess(null)
          }}
        >
          {isLogin ? "Sign Up" : "Login"}
        </Button>

        <Card className="w-[400px] bg-black border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-2xl">
              {isLogin ? "Login" : "Create an Account"}
            </CardTitle>
            <Separator className="my-4 bg-gray-800" />
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                {isLogin
                  ? "Enter your credentials to login"
                  : "Enter your details below to create your account"}
              </p>
            </div>

            <form 
              onSubmit={(e) => { e.preventDefault(); handleAuth(); }} 
              className="space-y-6"
              autoComplete="off"
              spellCheck="false"
              autoCorrect="off"
              data-lpignore="true"
            >
              <div className="space-y-6">
                {/* Hidden fields to prevent autofill */}
                <input type="text" style={{ display: 'none' }} />
                <input type="password" style={{ display: 'none' }} />
                
                <Input
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="bg-black border-gray-800 text-white focus-visible:ring-gray-600"
                  disabled={loading}
                  autoComplete="username"
                  autoCorrect="off"
                  spellCheck="false"
                  name="username"
                  id="username"
                  data-lpignore="true"
                  aria-autocomplete="none"
                />

                <Input
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="bg-black border-gray-800 text-white focus-visible:ring-gray-600"
                  disabled={loading}
                  autoComplete="current-password"
                  autoCorrect="off"
                  spellCheck="false"
                  name="current-password"
                  id="current-password"
                  data-lpignore="true"
                  aria-autocomplete="none"
                  aria-hidden="true"
                />

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-gray-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait...
                    </>
                  ) : (
                    isLogin ? "Login with Email" : "Sign Up with Email"
                  )}
                </Button>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-green-500 text-sm">{success}</p>}
            </form>

            <div className="flex items-center gap-4">
              <Separator className="flex-1 bg-gray-800" />
              <span className="text-xs text-muted-foreground">
                OR CONTINUE WITH
              </span>
              <Separator className="flex-1 bg-gray-800" />
            </div>

            <Button 
              variant="outline" 
              className="w-full justify-center border-gray-600 hover:bg-gray-900 hover:text-white text-white"
              disabled={loading}
              onClick={handleGoogleAuth}
            >
              <Mail className="mr-2 h-4 w-4" />
              Google
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By clicking continue, you agree to our{" "}
              <a href="#" className="underline hover:text-primary">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="underline hover:text-primary">
                Privacy Policy
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 