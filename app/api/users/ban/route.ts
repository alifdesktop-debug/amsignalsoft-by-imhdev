import { query } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    await query("UPDATE users SET is_banned = TRUE, banned_at = NOW() WHERE id = ?", [userId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Ban error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
