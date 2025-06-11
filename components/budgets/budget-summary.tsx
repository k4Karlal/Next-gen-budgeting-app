"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Legend } from "recharts"
import type { Budget, Category, Transaction } from "@/lib/types"
import { fadeUp } from "@/lib/motion"

interface BudgetSummaryProps {
  budgets: Budget[]
  categories: Category[]
  transactions: Transaction[]
  currentMonth: number
  currentYear: number
}

export default function BudgetSummary({
  budgets,
  categories,
  transactions,
  currentMonth,
  currentYear,
}: BudgetSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
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

  const calculateSpent = (categoryId: string) => {
    return transactions
      .filter(
        (t) =>
          t.category_id === categoryId &&
          t.type === "expense" &&
          new Date(t.transaction_date).getMonth() + 1 === currentMonth &&
          new Date(t.transaction_date).getFullYear() === currentYear,
      )
      .reduce((sum, t) => sum + t.amount, 0)
  }

  // Prepare data for the chart
  const chartData = budgets
    .filter((b) => b.month === currentMonth && b.year === currentYear)
    .map((budget) => {
      const spent = calculateSpent(budget.category_id)
      return {
        name: getCategoryName(budget.category_id).split(" ")[0], // First word only for better display
        budget: budget.amount,
        spent: spent,
        categoryId: budget.category_id,
      }
    })
    .sort((a, b) => b.budget - a.budget) // Sort by budget amount descending

  // Calculate totals
  const totalBudget = budgets
    .filter((b) => b.month === currentMonth && b.year === currentYear)
    .reduce((sum, b) => sum + b.amount, 0)

  const totalSpent = budgets
    .filter((b) => b.month === currentMonth && b.year === currentYear)
    .reduce((sum, b) => sum + calculateSpent(b.category_id), 0)

  const remainingBudget = totalBudget - totalSpent
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const chartConfig = {
    budget: {
      label: "Budget",
      color: "#3B82F6",
    },
    spent: {
      label: "Spent",
      color: "#EF4444",
    },
  }

  const getMonthName = (month: number) => {
    const date = new Date()
    date.setMonth(month - 1)
    return date.toLocaleString("default", { month: "long" })
  }

  return (
    <motion.div variants={fadeUp} className="space-y-4">
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <CardTitle className="text-base sm:text-lg">
            Budget Summary - {getMonthName(currentMonth)} {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-blue-50 border-none">
              <CardContent className="p-4">
                <p className="text-sm text-blue-700">Total Budget</p>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(totalBudget)}</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-none">
              <CardContent className="p-4">
                <p className="text-sm text-red-700">Total Spent</p>
                <p className="text-xl font-bold text-red-900">{formatCurrency(totalSpent)}</p>
              </CardContent>
            </Card>
            <Card className={`${remainingBudget >= 0 ? "bg-green-50" : "bg-red-50"} border-none`}>
              <CardContent className="p-4">
                <p className={`text-sm ${remainingBudget >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {remainingBudget >= 0 ? "Remaining" : "Over Budget"}
                </p>
                <p className={`text-xl font-bold ${remainingBudget >= 0 ? "text-green-900" : "text-red-900"}`}>
                  {formatCurrency(Math.abs(remainingBudget))}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium mb-2">
              Budget Utilization: {budgetUtilization.toFixed(1)}%
              <span className="text-xs text-gray-500 ml-2">
                ({formatCurrency(totalSpent)} of {formatCurrency(totalBudget)})
              </span>
            </p>

            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  barGap={0}
                  barCategoryGap={15}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={70} interval={0} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [`${formatCurrency(value)}`]}
                  />
                  <Legend />
                  <Bar dataKey="budget" name="Budget" fill={chartConfig.budget.color} />
                  <Bar dataKey="spent" name="Spent">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.spent > entry.budget ? "#EF4444" : "#10B981"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
