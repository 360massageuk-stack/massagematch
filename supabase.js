const SUPABASE_URL = 'https://zuamkrvmnvlejgrzxaxr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xstDQcp-3XNDm6UZgAjC-w_xFo0F-uZ';

window.mmSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
