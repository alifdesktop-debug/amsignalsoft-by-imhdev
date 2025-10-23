import { query } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const users = await query(
      "SELECT id, name, telegram, activation_key, activated_at, is_banned FROM users ORDER BY activated_at DESC",
    )

    return NextResponse.json({ users })
  } catch (error) {
    console.error("List users error:", error)
    return NextResponse.json({ users: [] }, { status: 500 })
  }
}
