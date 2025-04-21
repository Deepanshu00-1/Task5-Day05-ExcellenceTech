import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get session from URL (Supabase automatically handles this)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (!session) {
          throw new Error('No session found')
        }

        // After successful auth, check if user exists in profiles table
        // If not, create a profile
        const { data: userData } = await supabase.auth.getUser()
        
        if (userData && userData.user) {
          const user = userData.user
          const { data: existingProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error checking profile:', profileError)
          }

          // If profile doesn't exist, create one
          if (!existingProfile) {
            // Determine if the user should be an organizer
            const email = user.email
            const isOrganizer = email === 'test@organizer.com'
            
            // Insert new profile
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: user.id,
                  user_id: user.id,
                  name: user.user_metadata?.name || email?.split('@')[0] || 'User',
                  email: email,
                  is_organizer: isOrganizer
                }
              ])

            if (insertError) {
              console.error('Error creating profile:', insertError)
            }

            // Set organizer status in localStorage 
            localStorage.setItem('isOrganizer', isOrganizer ? 'true' : 'false')
            localStorage.setItem('userEmail', email || '')
          } else {
            // Set organizer status from existing profile
            localStorage.setItem('isOrganizer', existingProfile.is_organizer ? 'true' : 'false')
            localStorage.setItem('userEmail', existingProfile.email || '')
          }
        }

        // Redirect to home page after successful authentication
        navigate('/')
      } catch (err: any) {
        console.error('Auth callback error:', err.message)
        setError(err.message)
      }
    }

    handleAuthCallback()
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-black text-white p-6 rounded-lg border border-gray-800">
          <h2 className="text-xl font-bold mb-4">Authentication Error</h2>
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => navigate('/auth')}
            className="mt-4 px-4 py-2 bg-white text-black rounded hover:bg-gray-200"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      <Loader2 className="h-12 w-12 animate-spin text-white mb-4" />
      <p className="text-white text-lg">Completing authentication...</p>
    </div>
  )
} 