"use client"

import { useAuth } from "@/contexts/auth-context"
import Navbar from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Shield } from "lucide-react"

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p>Access denied. Admin privileges required.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Shield className="mr-2 h-6 w-6" />
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-600">Manage users and system settings</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Admin Features</CardTitle>
              <CardDescription>Administrative tools and user management</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Admin functionality including user management, system analytics, and category management will be
                available in the next update.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
