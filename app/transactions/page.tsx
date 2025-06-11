"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import Navbar from "@/components/layout/navbar"
import TransactionForm from "@/components/transactions/transaction-form"
import TransactionList from "@/components/transactions/transaction-list"
import type { Transaction, Category } from "@/lib/types"
import { Loader2 } from "lucide-react"
import { staggerContainer, fadeUp } from "@/lib/motion"

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false })

      // Fetch categories
      const { data: categoriesData } = await supabase.from("categories").select("*").order("name")

      setTransactions(transactionsData || [])
      setCategories(categoriesData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
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
          <p className="text-sm text-gray-600">Please sign in to view your transactions.</p>
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
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Transactions</h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600">Manage your income and expenses</p>
            </div>
            <div className="flex-shrink-0">
              <TransactionForm categories={categories} onTransactionAdded={fetchData} />
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <TransactionList transactions={transactions} categories={categories} onTransactionUpdated={fetchData} />
          </motion.div>
        </div>
      </motion.main>
    </div>
  )
}
