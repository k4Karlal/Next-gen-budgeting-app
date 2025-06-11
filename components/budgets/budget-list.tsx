"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import type { Budget, Category, Transaction } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import BudgetForm from "./budget-form"
import { staggerContainer, fadeUp } from "@/lib/motion"

interface BudgetListProps {
  budgets: Budget[]
  categories: Category[]
  transactions: Transaction[]
  onBudgetUpdated: () => void
  currentMonth: number
  currentYear: number
}

export default function BudgetList({
  budgets,
  categories,
  transactions,
  onBudgetUpdated,
  currentMonth,
  currentYear,
}: BudgetListProps) {
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const { user } = useAuth()

  const handleDelete = async (budgetId: string) => {
    if (!user || !confirm("Are you sure you want to delete this budget?")) {
      return
    }

    try {
      const { error } = await supabase.from("budgets").delete().eq("id", budgetId).eq("user_id", user.id)

      if (error) throw error
      onBudgetUpdated()
    } catch (error) {
      console.error("Error deleting budget:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId)
    return category?.name || "Unknown"
  }

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId)
    return category?.color || "#3B82F6"
  }

  const getMonthName = (month: number) => {
    const date = new Date()
    date.setMonth(month - 1)
    return date.toLocaleString("default", { month: "long" })
  }

  const calculateSpent = (categoryId: string, month: number, year: number) => {
    return transactions
      .filter(
        (t) =>
          t.category_id === categoryId &&
          t.type === "expense" &&
          new Date(t.transaction_date).getMonth() + 1 === month &&
          new Date(t.transaction_date).getFullYear() === year,
      )
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const calculateProgress = (spent: number, budget: number) => {
    if (budget <= 0) return 100
    const progress = (spent / budget) * 100
    return Math.min(progress, 100)
  }

  return (
    <div className="space-y-4">
      {editingBudget && (
        <BudgetForm
          categories={categories}
          onBudgetAdded={() => {
            onBudgetUpdated()
            setEditingBudget(null)
          }}
          editBudget={editingBudget}
          currentMonth={currentMonth}
          currentYear={currentYear}
        />
      )}

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
        {budgets.length === 0 ? (
          <motion.div variants={fadeUp} className="md:col-span-2 p-8 text-center bg-white rounded-lg border shadow-sm">
            <p className="text-gray-500">No budgets found. Add your first budget to start tracking your spending.</p>
          </motion.div>
        ) : (
          budgets.map((budget, index) => {
            const spent = calculateSpent(budget.category_id, budget.month, budget.year)
            const progress = calculateProgress(spent, budget.amount)
            const isOverBudget = spent > budget.amount
            const categoryName = getCategoryName(budget.category_id)
            const categoryColor = getCategoryColor(budget.category_id)
            const monthName = getMonthName(budget.month)

            return (
              <motion.div key={budget.id} variants={fadeUp} custom={index}>
                <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: categoryColor }}></div>
                          <h3 className="font-medium text-gray-900">{categoryName}</h3>
                        </div>
                        <p className="text-sm text-gray-500">
                          {monthName} {budget.year}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => setEditingBudget(budget)}
                            className="cursor-pointer transition-colors hover:bg-gray-100"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(budget.id)}
                            className="text-red-600 cursor-pointer transition-colors hover:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {formatCurrency(spent)} of {formatCurrency(budget.amount)}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            isOverBudget ? "text-red-600" : progress > 80 ? "text-amber-600" : "text-green-600"
                          }`}
                        >
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={progress}
                        className={`h-2 ${
                          isOverBudget ? "bg-red-100" : progress > 80 ? "bg-amber-100" : "bg-green-100"
                        }`}
                        indicatorClassName={`${
                          isOverBudget ? "bg-red-600" : progress > 80 ? "bg-amber-600" : "bg-green-600"
                        }`}
                      />
                    </div>

                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-gray-500">Remaining:</span>
                      <span className={`font-medium ${isOverBudget ? "text-red-600" : "text-green-600"}`}>
                        {isOverBudget ? "-" : ""}
                        {formatCurrency(Math.abs(budget.amount - spent))}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}
      </motion.div>
    </div>
  )
}
