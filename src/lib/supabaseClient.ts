import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection function that can be called when needed
// but doesn't run automatically
export const testConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Test auth configuration
    await supabase.auth.getSession()
    
    // Test database connection
    await supabase.from('profiles').select('count').limit(1)
    
    return { 
      success: true,
      message: 'Successfully connected to Supabase'
    }
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error connecting to Supabase'
    }
  }
}
