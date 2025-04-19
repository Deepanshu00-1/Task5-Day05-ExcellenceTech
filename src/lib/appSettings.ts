import { supabase } from './supabaseClient';

/**
 * Get a setting value from the app_settings table
 * @param key The key to look up
 * @returns The setting value or null if not found
 */
export async function getAppSetting(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single();
      
    if (error) {
      console.error('Error fetching app setting:', error);
      return null;
    }
    
    return data?.value || null;
  } catch (error) {
    console.error('Error in getAppSetting:', error);
    return null;
  }
} 