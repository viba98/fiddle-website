import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Debug logging for production
if (typeof window === 'undefined') { // Server-side only
  console.log('Supabase Admin Init - URL:', supabaseUrl ? 'Present' : 'Missing')
  console.log('Supabase Admin Init - Service Key:', supabaseServiceKey ? 'Present' : 'Missing')
}

// Only create client if environment variables are available
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null 