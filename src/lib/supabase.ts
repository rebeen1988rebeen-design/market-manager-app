import { createClient } from '@supabase/supabase-js';

const meta = import.meta as any;
const supabaseUrl = meta.env?.VITE_SUPABASE_URL || 'https://vhedchljfoszzjyiveve.supabase.co';
const supabaseAnonKey = meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4TpgQKal2zj4vZiIVSj5Zg_JhezHson';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
