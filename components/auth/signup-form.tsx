"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signUpSchema, validateAndSanitize } from "@/lib/validation"
import { Loader2 } from "lucide-react"
import AuthErrorHandler from "./auth-error-handler"
import { staggerContainer, fadeUp } from "@/lib/motion"

export default function SignUpForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signUp, user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Redirect if already signed in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard")
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const validatedData = validateAndSanitize(signUpSchema, {
        email,
        password,
        fullName,
      })

      const { error } = await signUp(validatedData.email, validatedData.password, validatedData.fullName)

      if (error) {
        if (error.message.includes("User already registered")) {
          setError("An account with this email already exists. Please sign in instead.")
        } else {
          setError(error.message || "An error occurred during sign up")
        }
      } else {
        // Success - redirect to dashboard
        setTimeout(() => {
          router.push("/dashboard")
        }, 500)
      }
    } catch (err: any) {
      setError(err.message || "Invalid input data")
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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="w-full max-w-md mx-auto border-none shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign Up</CardTitle>
          <CardDescription className="text-center">Create a new account to start budgeting</CardDescription>
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
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
                className="transition-all duration-200 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </motion.div>

            <motion.div variants={fadeUp} className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
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
                minLength={8}
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
                {loading ? "Creating Account..." : "Sign Up"}
              </Button>
            </motion.div>

            <motion.p variants={fadeUp} className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-blue-600 hover:underline transition-colors">
                Sign in
              </Link>
            </motion.p>
          </motion.form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
