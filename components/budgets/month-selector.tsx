"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { fadeIn } from "@/lib/motion"

interface MonthSelectorProps {
  currentMonth: number
  currentYear: number
  onMonthChange: (month: number, year: number) => void
}

export default function MonthSelector({ currentMonth, currentYear, onMonthChange }: MonthSelectorProps) {
  const getMonthName = (month: number) => {
    const date = new Date()
    date.setMonth(month - 1)
    return date.toLocaleString("default", { month: "long" })
  }

  const handlePreviousMonth = () => {
    let newMonth = currentMonth - 1
    let newYear = currentYear

    if (newMonth < 1) {
      newMonth = 12
      newYear--
    }

    onMonthChange(newMonth, newYear)
  }

  const handleNextMonth = () => {
    let newMonth = currentMonth + 1
    let newYear = currentYear

    if (newMonth > 12) {
      newMonth = 1
      newYear++
    }

    onMonthChange(newMonth, newYear)
  }

  const handleCurrentMonth = () => {
    const now = new Date()
    onMonthChange(now.getMonth() + 1, now.getFullYear())
  }

  return (
    <motion.div variants={fadeIn} className="flex items-center justify-between">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreviousMonth}
        className="flex items-center transition-all duration-200"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      <div className="flex items-center">
        <h2 className="text-lg font-semibold">
          {getMonthName(currentMonth)} {currentYear}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCurrentMonth}
          className="ml-2 text-xs text-blue-600 hover:text-blue-800"
        >
          Today
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNextMonth}
        className="flex items-center transition-all duration-200"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </motion.div>
  )
}
