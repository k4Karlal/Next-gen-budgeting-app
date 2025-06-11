"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import Navbar from "@/components/layout/navbar"
import BudgetForm from "@/components/budgets/budget-form"
import BudgetList from "@/components/budgets/budget-list"
import BudgetSummary from "@/components/budgets/budget-summary"
import MonthSelector from "@/components/budgets/month-selector"
import type { Budget, Category, Transaction } from "@/lib/types"
import { Loader2 } from "lucide-react"
import { staggerContainer, fadeUp } from "@/lib/motion"

export default function BudgetsPage() {
  const { user, loading: authLoading } = useAuth()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, currentMonth, currentYear])

  const fetchData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch budgets
      const { data: budgetsData } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", currentMonth)
        .eq("year", currentYear)

      // Fetch categories
      const { data: categoriesData } = await supabase.from("categories").select("*").eq("type", "expense").order("name")

      // Fetch transactions for the current month
      const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString().split("T")[0]
      const endDate = new Date(currentYear, currentMonth, 0).toISOString().split("T")[0]

      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .gte("transaction_date", startDate)
        .lte("transaction_date", endDate)

      setBudgets(budgetsData || [])
      setCategories(categoriesData || [])
      setTransactions(transactionsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMonthChange = (month: number, year: number) => {
    setCurrentMonth(month)
    setCurrentYear(year)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600">Loading...</p>
          </motion.div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-sm text-gray-600">Please sign in to view your budgets.</p>
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
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Budgets</h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600">Set and track your spending goals</p>
            </div>
            <div className="flex-shrink-0">
              <BudgetForm
                categories={categories}
                onBudgetAdded={fetchData}
                currentMonth={currentMonth}
                currentYear={currentYear}
              />
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="mb-6">
            <MonthSelector currentMonth={currentMonth} currentYear={currentYear} onMonthChange={handleMonthChange} />
          </motion.div>

          {budgets.length > 0 && (
            <motion.div variants={fadeUp}>
              <BudgetSummary
                budgets={budgets}
                categories={categories}
                transactions={transactions}
                currentMonth={currentMonth}
                currentYear={currentYear}
              />
            </motion.div>
          )}

          <motion.div variants={fadeUp}>
            <BudgetList
              budgets={budgets}
              categories={categories}
              transactions={transactions}
              onBudgetUpdated={fetchData}
              currentMonth={currentMonth}
              currentYear={currentYear}
            />
          </motion.div>
        </div>
      </motion.main>
    </div>
  )
}
