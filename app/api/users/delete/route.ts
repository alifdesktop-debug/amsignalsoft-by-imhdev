import { query } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    await query("DELETE FROM users WHERE id = ?", [userId])

    return NextResponse.json({ success: true, deletedUserId: userId })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
