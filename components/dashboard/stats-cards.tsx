"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, PiggyBank, Target } from "lucide-react"
import type { DashboardStats } from "@/lib/types"
import { staggerContainer, fadeUp } from "@/lib/motion"

interface StatsCardsProps {
  stats: DashboardStats
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const cards = [
    {
      title: "Total Income",
      value: formatCurrency(stats.totalIncome),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "#10B981",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(stats.totalExpenses),
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-100",
      borderColor: "#EF4444",
    },
    {
      title: "Net Savings",
      value: formatCurrency(stats.totalSavings),
      icon: PiggyBank,
      color: stats.totalSavings >= 0 ? "text-green-600" : "text-red-600",
      bgColor: stats.totalSavings >= 0 ? "bg-green-100" : "bg-red-100",
      borderColor: stats.totalSavings >= 0 ? "#10B981" : "#EF4444",
    },
    {
      title: "Budget Usage",
      value: stats.budgetUtilization > 0 ? formatPercentage(stats.budgetUtilization) : "No Budget",
      icon: Target,
      color:
        stats.budgetUtilization > 90
          ? "text-red-600"
          : stats.budgetUtilization > 75
            ? "text-amber-600"
            : "text-blue-600",
      bgColor:
        stats.budgetUtilization > 90 ? "bg-red-100" : stats.budgetUtilization > 75 ? "bg-amber-100" : "bg-blue-100",
      borderColor: stats.budgetUtilization > 90 ? "#EF4444" : stats.budgetUtilization > 75 ? "#F59E0B" : "#3B82F6",
    },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
    >
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <motion.div key={card.title} variants={fadeUp} custom={index}>
            <Card
              className="overflow-hidden border-b-4 transition-all duration-200 hover:shadow-md hover:scale-105"
              style={{
                borderBottomColor: card.borderColor,
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 truncate pr-2">
                  {card.title}
                </CardTitle>
                <div
                  className={`p-2 sm:p-2.5 rounded-full ${card.bgColor} transform transition-transform duration-300 hover:scale-110 flex-shrink-0`}
                >
                  <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className={`text-lg sm:text-xl lg:text-2xl font-bold ${card.color} truncate`}>{card.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
