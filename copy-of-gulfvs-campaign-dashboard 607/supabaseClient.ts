import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = 'https://xvutrxbfwayyoarcqibz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XSD0GMDOhuyb-ysFsDbK5g_gdko4z58';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Initialize schema if needed
export const initializeSupabaseSchema = async () => {
  try {
    // Check if tables exist by attempting a query
    const { error: companiesError } = await supabase
      .from('companies')
      .select('id', { count: 'exact', head: true });
    
    if (companiesError?.code === 'PGRST116') {
      // Table doesn't exist, create it
      console.log('Creating companies table...');
    }

    const { error: logsError } = await supabase
      .from('logs')
      .select('id', { count: 'exact', head: true });
    
    if (logsError?.code === 'PGRST116') {
      // Table doesn't exist, create it
      console.log('Creating logs table...');
    }
  } catch (error) {
    console.warn('Supabase initialization check:', error);
  }
};
