export interface User {
  id: string
  email: string
  full_name: string
  role: "user" | "admin"
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  type: "income" | "expense"
  color: string
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string
  amount: number
  description: string | null
  transaction_date: string
  type: "income" | "expense"
  created_at: string
  updated_at: string
  category?: Category
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  month: number
  year: number
  created_at: string
  updated_at: string
  category?: Category
}

export interface AuthState {
  user: User | null
  loading: boolean
}

export interface DashboardStats {
  totalIncome: number
  totalExpenses: number
  totalSavings: number
  transactionCount: number
  budgetUtilization: number
}
