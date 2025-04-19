import { supabase } from './supabaseClient';

/**
 * Get an application setting from the database
 * @param key The setting key to retrieve
 * @returns The setting value or null if not found or error
 */
export async function getAppSetting(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single();
    
    if (error) {
      return null;
    }
    
    return data?.value || null;
  } catch (error) {
    return null;
  }
} 