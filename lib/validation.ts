import { z } from "zod"

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
})

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const transactionSchema = z.object({
  category_id: z.string().uuid("Invalid category"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  type: z.enum(["income", "expense"]),
})

export const budgetSchema = z.object({
  category_id: z.string().uuid("Invalid category"),
  amount: z.number().positive("Amount must be positive"),
  month: z.number().min(1).max(12, "Month must be between 1 and 12"),
  year: z.number().min(2020).max(2030, "Year must be between 2020 and 2030"),
})

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "")
}

export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.parse(data)

  // Sanitize string fields
  if (typeof result === "object" && result !== null) {
    const sanitized = { ...result }
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === "string") {
        ;(sanitized as any)[key] = sanitizeInput(value)
      }
    }
    return sanitized
  }

  return result
}
