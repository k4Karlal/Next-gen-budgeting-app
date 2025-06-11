"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface AuthErrorHandlerProps {
  error: string | null
}

export default function AuthErrorHandler({ error }: AuthErrorHandlerProps) {
  if (!error) return null

  // Map common Supabase errors to user-friendly messages
  const getErrorMessage = (error: string) => {
    if (error.includes("Email not confirmed")) {
      return "Your account is being set up. Please wait a moment and try again."
    }
    if (error.includes("Invalid login credentials")) {
      return "Invalid email or password. Please check your credentials and try again."
    }
    if (error.includes("User already registered")) {
      return "An account with this email already exists. Please sign in instead."
    }
    if (error.includes("row-level security")) {
      return "Account setup in progress. Please try again in a moment."
    }
    return error
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">{getErrorMessage(error)}</AlertDescription>
        </Alert>
      </motion.div>
    </AnimatePresence>
  )
}
