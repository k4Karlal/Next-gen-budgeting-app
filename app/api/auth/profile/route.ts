import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request: Request) {
  try {
    const supabase = createServerClient()

    // Get the user from the session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Session error:", sessionError)
      return NextResponse.json({ error: "Session error" }, { status: 401 })
    }

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = session.user.id
    console.log("API: Fetching profile for user:", userId)

    // Create profile from auth data as fallback
    const createProfileFromAuth = () => ({
      id: session.user.id,
      email: session.user.email || "",
      full_name: session.user.user_metadata?.full_name || "User",
      role: "user" as const,
      created_at: session.user.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    try {
      // Try to fetch from database with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const { data, error } = await supabaseAdmin
        .from("users")
        .select("id, email, full_name, role, created_at, updated_at")
        .eq("id", userId)
        .maybeSingle()

      clearTimeout(timeoutId)

      if (error) {
        console.error("Database error:", error.message)
        // Return auth data if database fails
        return NextResponse.json(createProfileFromAuth())
      }

      if (data) {
        console.log("Profile found in database:", data.email)
        return NextResponse.json(data)
      }

      // No profile found, create one
      console.log("No profile found, creating new one")
      const newProfile = createProfileFromAuth()

      const { data: insertedProfile, error: insertError } = await supabaseAdmin
        .from("users")
        .insert(newProfile)
        .select("id, email, full_name, role, created_at, updated_at")
        .maybeSingle()

      if (insertError) {
        console.error("Insert error:", insertError.message)
        // Return auth data even if insert fails
        return NextResponse.json(newProfile)
      }

      return NextResponse.json(insertedProfile || newProfile)
    } catch (dbError) {
      console.error("Database operation failed:", dbError)
      // Always return auth data as fallback
      return NextResponse.json(createProfileFromAuth())
    }
  } catch (error) {
    console.error("Profile API critical error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
