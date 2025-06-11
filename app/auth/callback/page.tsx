"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the code from URL params
        const code = searchParams.get("code")
        const next = searchParams.get("next") || "/dashboard"

        if (code) {
          // Exchange the code for a session
          const { error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error("Auth callback error:", error)
            router.push("/auth/signin")
            return
          }
        }

        // Check if we have a valid session
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Session error:", error)
          router.push("/auth/signin")
          return
        }

        if (data.session) {
          router.push(next)
        } else {
          router.push("/auth/signin")
        }
      } catch (error) {
        console.error("Auth callback error:", error)
        router.push("/auth/signin")
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Completing sign in...</p>
      </div>
    </div>
  )
}
