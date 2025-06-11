import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Disable automatic URL detection
    flowType: "implicit", // Use implicit flow instead of PKCE
  },
})

// For server-side operations
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}
