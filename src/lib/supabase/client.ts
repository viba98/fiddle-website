import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug logging for production
if (typeof window === 'undefined') { // Server-side only
  console.log('Supabase Client Init - URL:', supabaseUrl ? 'Present' : 'Missing')
  console.log('Supabase Client Init - Key:', supabaseAnonKey ? 'Present' : 'Missing')
}

// Only create client if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
