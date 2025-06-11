"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import Navbar from "@/components/layout/navbar"
import StatsCards from "@/components/dashboard/stats-cards"
import ExpenseChart from "@/components/dashboard/expense-chart"
import type { Transaction, Category, DashboardStats, Budget } from "@/lib/types"
import { Loader2 } from "lucide-react"
import { staggerContainer, fadeUp } from "@/lib/motion"

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    transactionCount: 0,
    budgetUtilization: 0,
  })
  const [loading, setLoading] = useState(true)
  const [dataFetched, setDataFetched] = useState(false)

  // Memoized redirect logic to prevent loops
  const handleRedirect = useCallback(() => {
    if (!authLoading && !user) {
      console.log("No user found, redirecting to sign in")
      router.push("/auth/signin")
    }
  }, [user, authLoading, router])

  // Memoized data fetching to prevent loops
  const fetchDashboardData = useCallback(async () => {
    if (!user || dataFetched) return

    try {
      setLoading(true)
      console.log("Fetching dashboard data for:", user.email)

      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()

      // Fetch transactions with error handling
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false })
        .limit(100)

      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError)
      } else {
        console.log("Fetched transactions:", transactionsData?.length || 0)
        setTransactions(transactionsData || [])
      }

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("name")

      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError)
      } else {
        console.log("Fetched categories:", categoriesData?.length || 0)
        setCategories(categoriesData || [])
      }

      // Fetch budgets for current month
      const { data: budgetsData, error: budgetsError } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", currentMonth)
        .eq("year", currentYear)

      if (budgetsError) {
        console.error("Error fetching budgets:", budgetsError)
      } else {
        console.log("Fetched budgets:", budgetsData?.length || 0)
        setBudgets(budgetsData || [])
      }

      // Calculate stats
      if (transactionsData) {
        const monthlyTransactions = transactionsData.filter((t) => {
          const transactionDate = new Date(t.transaction_date)
          return transactionDate.getMonth() + 1 === currentMonth && transactionDate.getFullYear() === currentYear
        })

        const totalIncome = monthlyTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

        const totalExpenses = monthlyTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0)

        // Calculate budget utilization
        const totalBudget = budgetsData?.reduce((sum, b) => sum + b.amount, 0) || 0
        const budgetUtilization = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0

        setStats({
          totalIncome,
          totalExpenses,
          totalSavings: totalIncome - totalExpenses,
          transactionCount: transactionsData.length,
          budgetUtilization,
        })
      }

      setDataFetched(true)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }, [user, dataFetched])

  // Handle redirect - only run when auth state changes
  useEffect(() => {
    handleRedirect()
  }, [handleRedirect])

  // Fetch data - only run when user is available and data not fetched
  useEffect(() => {
    if (user && !authLoading && !dataFetched) {
      console.log("User available, fetching dashboard data...")
      fetchDashboardData()
    }
  }, [user, authLoading, dataFetched, fetchDashboardData])

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600">Loading...</p>
          </motion.div>
        </div>
      </div>
    )
  }

  // Show nothing while redirecting (prevent flash)
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600">Redirecting...</p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <motion.main
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="w-full max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8"
      >
        <div className="space-y-6 sm:space-y-8">
          <motion.div variants={fadeUp} className="space-y-2">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900"
            >
              Welcome back, {user.full_name}!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-sm sm:text-base text-gray-600"
            >
              Here's an overview of your financial activity this month.
            </motion.p>
          </motion.div>

          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-32 sm:h-64"
            >
              <div className="text-center">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-600">Loading dashboard data...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6 sm:space-y-8">
              <StatsCards stats={stats} />
              <ExpenseChart transactions={transactions} categories={categories} />
            </motion.div>
          )}
        </div>
      </motion.main>
    </div>
  )
}
