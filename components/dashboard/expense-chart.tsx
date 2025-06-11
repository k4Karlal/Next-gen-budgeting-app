"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts"
import type { Transaction, Category } from "@/lib/types"
import { fadeUp, staggerContainer } from "@/lib/motion"

interface ExpenseChartProps {
  transactions: Transaction[]
  categories: Category[]
}

export default function ExpenseChart({ transactions, categories }: ExpenseChartProps) {
  // Prepare data for expense breakdown
  const expenseData = categories
    .filter((cat) => cat.type === "expense")
    .map((category) => {
      const categoryTransactions = transactions.filter((t) => t.category_id === category.id && t.type === "expense")
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0)

      return {
        name: category.name,
        value: total,
        color: category.color,
      }
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)

  // Prepare data for monthly trend
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const monthName = new Date(2024, i, 1).toLocaleString("default", { month: "short" })

    const monthTransactions = transactions.filter((t) => {
      const transactionMonth = new Date(t.transaction_date).getMonth() + 1
      return transactionMonth === month
    })

    const income = monthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

    const expenses = monthTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    return {
      month: monthName,
      income,
      expenses,
    }
  })

  const chartConfig = {
    income: {
      label: "Income",
      color: "#10B981",
    },
    expenses: {
      label: "Expenses",
      color: "#EF4444",
    },
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6"
    >
      <motion.div variants={fadeUp}>
        <Card className="transition-all duration-300 hover:shadow-lg h-full">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-base sm:text-lg">Expense Breakdown</CardTitle>
            <CardDescription className="text-sm">Your spending by category this month</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[250px] sm:max-h-[300px] lg:max-h-[350px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      window.innerWidth > 640
                        ? `${name} ${(percent * 100).toFixed(0)}%`
                        : `${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={window.innerWidth < 640 ? 60 : 80}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={200}
                    animationDuration={1000}
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Amount"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card className="transition-all duration-300 hover:shadow-lg h-full">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-base sm:text-lg">Monthly Trend</CardTitle>
            <CardDescription className="text-sm">Income vs expenses over the year</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] lg:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                  <XAxis
                    dataKey="month"
                    fontSize={window.innerWidth < 640 ? 10 : 12}
                    tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                  />
                  <YAxis
                    fontSize={window.innerWidth < 640 ? 10 : 12}
                    tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [`$${value.toFixed(2)}`]}
                  />
                  <Bar dataKey="income" fill={chartConfig.income.color} animationDuration={1000} />
                  <Bar dataKey="expenses" fill={chartConfig.expenses.color} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
