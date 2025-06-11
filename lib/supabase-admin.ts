import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a service role client that bypasses RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      "Content-Type": "application/json",
    },
  },
})

// Production-ready helper function to safely query users table
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle()

    if (error) {
      console.error("Error fetching user profile:", error.message)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Critical error in getUserProfile:", error)
    return { data: null, error }
  }
}

// Production-ready helper function to create or update user profile
export async function upsertUserProfile(profile: {
  id: string
  email: string
  full_name: string
  role: string
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .upsert(profile, {
        onConflict: "id",
        ignoreDuplicates: false,
      })
      .select("id, email, full_name, role, created_at, updated_at")
      .maybeSingle()

    if (error) {
      console.error("Error upserting user profile:", error.message)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Critical error in upsertUserProfile:", error)
    return { data: null, error }
  }
}

// Health check function for the database connection
export async function checkDatabaseHealth() {
  try {
    const { data, error } = await supabaseAdmin.from("categories").select("count").limit(1)

    return { healthy: !error, error: error?.message }
  } catch (error) {
    return { healthy: false, error: String(error) }
  }
}
