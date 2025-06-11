"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { User, AuthState } from "@/lib/types"

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Use refs to prevent infinite loops and duplicate events
  const fetchingProfile = useRef(false)
  const lastUserId = useRef<string | null>(null)
  const lastEventTime = useRef<number>(0)
  const authSubscription = useRef<any>(null)

  // Memoized function to create user from auth data
  const createUserFromAuth = useCallback((authUser: any): User => {
    return {
      id: authUser.id,
      email: authUser.email || "",
      full_name: authUser.user_metadata?.full_name || "User",
      role: "user",
      created_at: authUser.created_at || new Date().toISOString(),
      updated_at: authUser.updated_at || new Date().toISOString(),
    }
  }, [])

  // Robust profile fetching with loop prevention
  const fetchUserProfile = useCallback(
    async (authUser: any) => {
      if (!authUser || fetchingProfile.current || lastUserId.current === authUser.id) {
        return
      }

      fetchingProfile.current = true
      lastUserId.current = authUser.id

      console.log("Fetching user profile for:", authUser.id)

      // Always have a fallback ready
      const fallbackUser = createUserFromAuth(authUser)

      try {
        // Try API with timeout and error handling
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)

        const response = await fetch("/api/auth/profile", {
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const text = await response.text()

          if (text.trim().startsWith("{")) {
            try {
              const profile = JSON.parse(text)
              if (profile && !profile.error && profile.id) {
                console.log("User profile loaded via API:", profile.email)
                setUser(profile)
                return
              }
            } catch (parseError) {
              console.error("JSON parse error:", parseError)
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("API fetch error:", error)
        }
      }

      // Always fall back to auth data
      console.log("Using fallback user data:", fallbackUser.email)
      setUser(fallbackUser)
    },
    [createUserFromAuth],
  )

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      if (initialized) return

      try {
        console.log("Initializing auth...")

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        console.log("Initial session check:", {
          hasSession: !!session,
          userId: session?.user?.id,
          error: error?.message,
        })

        if (mounted) {
          if (session?.user) {
            await fetchUserProfile(session.user)
          }
          setInitialized(true)
          setLoading(false)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        if (mounted) {
          setInitialized(true)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes - but prevent duplicate events
    authSubscription.current = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted || !initialized) return

      // Debounce auth events to prevent duplicates
      const now = Date.now()
      if (now - lastEventTime.current < 1000) {
        console.log("Debouncing auth event:", event)
        return
      }
      lastEventTime.current = now

      console.log("Auth state changed:", event, {
        hasSession: !!session,
        userId: session?.user?.id,
      })

      // Reset fetching state on sign out
      if (event === "SIGNED_OUT") {
        fetchingProfile.current = false
        lastUserId.current = null
        setUser(null)
        return
      }

      // Only fetch profile for sign in events or if user changed
      if (event === "SIGNED_IN" && session?.user) {
        if (lastUserId.current !== session.user.id) {
          fetchingProfile.current = false // Reset for new user
          await fetchUserProfile(session.user)
        }
      }

      // Handle token refresh without refetching profile
      if (event === "TOKEN_REFRESHED" && session?.user && lastUserId.current === session.user.id) {
        console.log("Token refreshed for existing user")
        return
      }
    })

    return () => {
      mounted = false
      if (authSubscription.current) {
        authSubscription.current.data.subscription.unsubscribe()
      }
    }
  }, [initialized, fetchUserProfile])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      console.log("Attempting sign in for:", email)

      // Reset state for new sign in
      fetchingProfile.current = false
      lastUserId.current = null
      lastEventTime.current = 0

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error.message)
        throw error
      }

      console.log("Sign in successful")
      return { error: null }
    } catch (error: any) {
      console.error("Sign in failed:", error)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true)
      console.log("Attempting sign up for:", email)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        console.error("Sign up error:", error.message)
        throw error
      }

      console.log("Sign up successful")
      return { error: null }
    } catch (error: any) {
      console.error("Sign up failed:", error)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      console.log("Signing out...")

      // Reset all state
      fetchingProfile.current = false
      lastUserId.current = null
      lastEventTime.current = 0

      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error.message)
        throw error
      }

      setUser(null)
      console.log("Sign out successful")
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    if (fetchingProfile.current) return

    try {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        console.error("Error getting user:", error.message)
        return
      }

      if (authUser && lastUserId.current !== authUser.id) {
        fetchingProfile.current = false // Allow refresh for different user
        await fetchUserProfile(authUser)
      } else if (!authUser) {
        setUser(null)
      }
    } catch (error) {
      console.error("Error refreshing user:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
