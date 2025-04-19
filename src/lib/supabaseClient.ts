import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

console.log('Initializing Supabase with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Test function to verify Supabase connection and auth
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Auth Configuration
    const { data: authTest, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('Auth test failed:', authError.message);
      throw new Error(`Auth Error: ${authError.message}`);
    }
    console.log('✅ Auth Configuration: Success');

    // Test 2: Database Connection
    const { data: dbTest, error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (dbError && dbError.message !== 'relation "public.profiles" does not exist') {
      console.error('Database test failed:', dbError.message);
      throw new Error(`Database Error: ${dbError.message}`);
    }
    console.log('✅ Database Connection: Success');

    return { success: true, message: 'Supabase connection and auth are working correctly' };
  } catch (error: any) {
    console.error('❌ Supabase Test Failed:', error.message);
    return { success: false, message: error.message };
  }
};
