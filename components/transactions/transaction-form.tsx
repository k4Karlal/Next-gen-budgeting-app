"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import type { Category, Transaction } from "@/lib/types"
import { transactionSchema, validateAndSanitize } from "@/lib/validation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { showSuccessToast, showErrorToast } from "@/lib/toast"

interface TransactionFormProps {
  categories: Category[]
  onTransactionAdded: () => void
  editTransaction?: Transaction
}

export default function TransactionForm({ categories, onTransactionAdded, editTransaction }: TransactionFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { user } = useAuth()

  const today = new Date().toISOString().split("T")[0]

  const [formData, setFormData] = useState({
    category_id: editTransaction?.category_id || "",
    amount: editTransaction?.amount?.toString() || "",
    description: editTransaction?.description || "",
    transaction_date: editTransaction?.transaction_date || today,
    type: editTransaction?.type || ("expense" as "income" | "expense"),
  })

  // Reset form when editTransaction changes
  useEffect(() => {
    if (editTransaction) {
      setFormData({
        category_id: editTransaction.category_id,
        amount: editTransaction.amount.toString(),
        description: editTransaction.description || "",
        transaction_date: editTransaction.transaction_date,
        type: editTransaction.type,
      })
    }
  }, [editTransaction])

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

      const amount = Number.parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount greater than 0")
      }

      // Validate date is not in the future
      const selectedDate = new Date(formData.transaction_date)
      const currentDate = new Date()
      currentDate.setHours(23, 59, 59, 999) // End of today

      if (selectedDate > currentDate) {
        throw new Error("Transaction date cannot be in the future")
      }

      const validatedData = validateAndSanitize(transactionSchema, {
        ...formData,
        amount,
      })

      if (editTransaction) {
        const { error } = await supabase
          .from("transactions")
          .update({
            ...validatedData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editTransaction.id)
          .eq("user_id", user.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("transactions").insert([
          {
            ...validatedData,
            user_id: user.id,
          },
        ])

        if (error) throw error
      }

      setOpen(false)
      onTransactionAdded()
      showSuccessToast(editTransaction ? "Transaction updated successfully!" : "Transaction added successfully!")

      // Reset form
      setFormData({
        category_id: "",
        amount: "",
        description: "",
        transaction_date: today,
        type: "expense",
      })
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred"
      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter((cat) => cat.type === formData.type)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow">
          <Plus className="mr-2 h-4 w-4" />
          {editTransaction ? "Edit Transaction" : "Add Transaction"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTransaction ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
          <DialogDescription>
            {editTransaction ? "Update your transaction details below." : "Enter the details for your new transaction."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "income" | "expense") =>
                setFormData({ ...formData, type: value, category_id: "" })
              }
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                        {category.name}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No categories available for {formData.type}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
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

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.transaction_date}
              onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
              required
              disabled={loading}
              max={today}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
              rows={3}
              className="w-full resize-none"
              placeholder="Enter a description"
            />
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
              {editTransaction ? "Update" : "Add"} Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
