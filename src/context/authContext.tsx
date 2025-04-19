// src/context/AuthContext.tsx
import { createContext, useEffect, useState, useContext, ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'

type AuthContextType = {
  user: any | null
}

const AuthContext = createContext<AuthContextType>({ user: null })

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
