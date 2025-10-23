import { query } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    await query("UPDATE users SET is_banned = FALSE, banned_at = NULL WHERE id = ?", [userId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unban error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
