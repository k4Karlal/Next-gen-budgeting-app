"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import type { Transaction, Category } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import TransactionForm from "./transaction-form"
import { staggerContainer, fadeIn } from "@/lib/motion"

interface TransactionListProps {
  transactions: Transaction[]
  categories: Category[]
  onTransactionUpdated: () => void
}

export default function TransactionList({ transactions, categories, onTransactionUpdated }: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const { user } = useAuth()

  const handleDelete = async (transactionId: string) => {
    if (!user || !confirm("Are you sure you want to delete this transaction?")) {
      return
    }

    try {
      const { error } = await supabase.from("transactions").delete().eq("id", transactionId).eq("user_id", user.id)

      if (error) throw error
      onTransactionUpdated()
    } catch (error) {
      console.error("Error deleting transaction:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId)
    return category?.name || "Unknown"
  }

  return (
    <div className="space-y-4">
      {editingTransaction && (
        <TransactionForm
          categories={categories}
          onTransactionAdded={() => {
            onTransactionUpdated()
            setEditingTransaction(null)
          }}
          editTransaction={editingTransaction}
        />
      )}

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="rounded-md border overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
      >
        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="text-xs lg:text-sm">Date</TableHead>
                <TableHead className="text-xs lg:text-sm">Description</TableHead>
                <TableHead className="text-xs lg:text-sm">Category</TableHead>
                <TableHead className="text-xs lg:text-sm">Type</TableHead>
                <TableHead className="text-right text-xs lg:text-sm">Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    <motion.div variants={fadeIn}>
                      No transactions found. Add your first transaction to get started.
                    </motion.div>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="group border-b transition-colors hover:bg-gray-50"
                  >
                    <TableCell className="py-3 text-xs lg:text-sm">
                      {formatDate(transaction.transaction_date)}
                    </TableCell>
                    <TableCell className="max-w-[150px] lg:max-w-[200px] truncate text-xs lg:text-sm">
                      {transaction.description || "No description"}
                    </TableCell>
                    <TableCell className="text-xs lg:text-sm">{getCategoryName(transaction.category_id)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={transaction.type === "income" ? "default" : "secondary"}
                        className={`transition-all duration-200 text-xs ${
                          transaction.type === "income"
                            ? "bg-green-100 text-green-800 group-hover:bg-green-200"
                            : "bg-red-100 text-red-800 group-hover:bg-red-200"
                        }`}
                      >
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-xs lg:text-sm">
                      <span className={`${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => setEditingTransaction(transaction)}
                            className="cursor-pointer transition-colors hover:bg-gray-100"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-600 cursor-pointer transition-colors hover:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 px-4">
              <motion.div variants={fadeIn}>
                No transactions found. Add your first transaction to get started.
              </motion.div>
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.description || "No description"}
                      </p>
                      <p className="text-xs text-gray-500">{getCategoryName(transaction.category_id)}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <Badge
                        variant={transaction.type === "income" ? "default" : "secondary"}
                        className={`text-xs ${
                          transaction.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {transaction.type}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => setEditingTransaction(transaction)}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-600 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{formatDate(transaction.transaction_date)}</span>
                    <span
                      className={`text-sm font-medium ${
                        transaction.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
