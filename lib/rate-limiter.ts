// Simple in-memory rate limiter for additional security
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests = 5, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []

    // Remove old requests outside the window
    const validRequests = requests.filter((time) => now - time < this.windowMs)

    if (validRequests.length >= this.maxRequests) {
      return false
    }

    validRequests.push(now)
    this.requests.set(identifier, validRequests)

    return true
  }

  reset(identifier: string): void {
    this.requests.delete(identifier)
  }
}

export const authRateLimiter = new RateLimiter(5, 60000) // 5 requests per minute
export const apiRateLimiter = new RateLimiter(100, 60000) // 100 requests per minute
