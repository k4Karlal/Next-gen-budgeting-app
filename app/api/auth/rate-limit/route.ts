import { type NextRequest, NextResponse } from "next/server"
import { authRateLimiter } from "@/lib/rate-limiter"

export async function POST(request: NextRequest) {
  try {
    const { identifier } = await request.json()

    if (!identifier) {
      return NextResponse.json({ error: "Identifier required" }, { status: 400 })
    }

    const isAllowed = authRateLimiter.isAllowed(identifier)

    return NextResponse.json({
      allowed: isAllowed,
      message: isAllowed ? "Request allowed" : "Rate limit exceeded",
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
