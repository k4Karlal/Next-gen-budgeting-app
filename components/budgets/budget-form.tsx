"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Loader2 } from "lucide-react"
import type { Category, Budget } from "@/lib/types"
import { budgetSchema, validateAndSanitize } from "@/lib/validation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

interface BudgetFormProps {
  categories: Category[]
  onBudgetAdded: () => void
  editBudget?: Budget
  currentMonth?: number
  currentYear?: number
}

export default function BudgetForm({
  categories,
  onBudgetAdded,
  editBudget,
  currentMonth = new Date().getMonth() + 1,
  currentYear = new Date().getFullYear(),
}: BudgetFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    category_id: editBudget?.category_id || "",
    amount: editBudget?.amount?.toString() || "",
    month: editBudget?.month || currentMonth,
    year: editBudget?.year || currentYear,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setError("")
    setLoading(true)

    try {
      // Validate inputs
      if (!formData.category_id) {
        throw new Error("Please select a category")
      }

      const amount = Number.parseFloat(formData.amount.toString())
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount greater than 0")
      }

      const validatedData = validateAndSanitize(budgetSchema, {
        ...formData,
        amount,
      })

      if (editBudget) {
        const { error } = await supabase
          .from("budgets")
          .update({
            ...validatedData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editBudget.id)
          .eq("user_id", user.id)

        if (error) throw error
      } else {
        // Check if budget already exists for this category, month, and year
        const { data: existingBudget } = await supabase
          .from("budgets")
          .select("id")
          .eq("user_id", user.id)
          .eq("category_id", validatedData.category_id)
          .eq("month", validatedData.month)
          .eq("year", validatedData.year)
          .maybeSingle()

        if (existingBudget) {
          // Update existing budget
          const { error } = await supabase
            .from("budgets")
            .update({
              amount: validatedData.amount,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingBudget.id)
            .eq("user_id", user.id)

          if (error) throw error
        } else {
          // Insert new budget
          const { error } = await supabase.from("budgets").insert([
            {
              ...validatedData,
              user_id: user.id,
            },
          ])

          if (error) throw error
        }
      }

      setOpen(false)
      onBudgetAdded()
      console.log(editBudget ? "Budget updated successfully!" : "Budget added successfully!")

      // Reset form
      setFormData({
        category_id: "",
        amount: "",
        month: currentMonth,
        year: currentYear,
      })
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred"
      setError(errorMessage)
      console.error("Budget form error:", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const expenseCategories = categories.filter((cat) => cat.type === "expense")
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ]

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow">
          <Plus className="mr-2 h-4 w-4" />
          {editBudget ? "Edit Budget" : "Add Budget"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editBudget ? "Edit Budget" : "Add New Budget"}</DialogTitle>
          <DialogDescription>
            {editBudget ? "Update your budget details below." : "Set a budget for a specific category."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.length > 0 ? (
                  expenseCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                        {category.name}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No expense categories available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Budget Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              disabled={loading}
              placeholder="0.00"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select
                value={formData.month.toString()}
                onValueChange={(value) => setFormData({ ...formData, month: Number.parseInt(value) })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select
                value={formData.year.toString()}
                onValueChange={(value) => setFormData({ ...formData, year: Number.parseInt(value) })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.category_id || !formData.amount}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editBudget ? "Update" : "Add"} Budget
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
