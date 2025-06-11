"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signInSchema, validateAndSanitize } from "@/lib/validation"
import { Loader2 } from "lucide-react"
import AuthErrorHandler from "./auth-error-handler"
import { staggerContainer, fadeUp } from "@/lib/motion"

export default function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signIn, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const redirected = useRef(false)

  // Redirect if already signed in - prevent multiple redirects
  useEffect(() => {
    if (!authLoading && user && !redirected.current) {
      console.log("User already signed in, redirecting to dashboard")
      redirected.current = true
      router.push("/dashboard")
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const validatedData = validateAndSanitize(signInSchema, { email, password })
      const { error } = await signIn(validatedData.email, validatedData.password)

      if (error) {
        // Handle specific error cases
        if (error.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please check your credentials.")
        } else if (error.message.includes("Email not confirmed")) {
          setError("Please check your email and click the confirmation link.")
        } else if (error.message.includes("Too many requests")) {
          setError("Too many sign-in attempts. Please wait a moment and try again.")
        } else {
          setError(error.message || "An error occurred during sign in")
        }
      } else {
        // Success - redirect will happen via useEffect when user state updates
        console.log("Sign in successful, waiting for redirect...")
        // Small delay to allow auth state to update
        setTimeout(() => {
          if (!redirected.current) {
            redirected.current = true
            router.push("/dashboard")
          }
        }, 1000)
      }
    } catch (err: any) {
      console.error("Sign in form error:", err)
      setError("Please check your input and try again.")
    } finally {
      setLoading(false)
    }
  }

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading...</span>
          </motion.div>
        </CardContent>
      </Card>
    )
  }

  // Don't render form if user is already signed in
  if (user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Redirecting to dashboard...</span>
          </motion.div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="w-full max-w-md mx-auto border-none shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <motion.form
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <AuthErrorHandler error={error} />

            <motion.div variants={fadeUp} className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                className="transition-all duration-200 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </motion.div>

            <motion.div variants={fadeUp} className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
                className="transition-all duration-200 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </motion.div>

            <motion.div variants={fadeUp}>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:shadow-md"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </motion.div>

            <motion.p variants={fadeUp} className="text-center text-sm text-gray-600">
              {"Don't have an account? "}
              <Link href="/auth/signup" className="text-blue-600 hover:underline transition-colors">
                Sign up
              </Link>
            </motion.p>
          </motion.form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
