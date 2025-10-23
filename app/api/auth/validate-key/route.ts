import { query } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { key, telegram, name } = await request.json()

    // Check if key exists and is valid
    const keys = (await query("SELECT * FROM activation_keys WHERE key_code = ? AND is_active = TRUE", [key])) as any[]

    if (keys.length === 0) {
      return NextResponse.json({ valid: false, message: "Invalid key" }, { status: 400 })
    }

    const activationKey = keys[0]

    // Check expiration
    if (activationKey.expires_at && new Date(activationKey.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, message: "Key expired" }, { status: 400 })
    }

    // Check if one-time key already used
    if (activationKey.type === "one-time") {
      const usage = (await query("SELECT * FROM key_usage WHERE key_code = ?", [key])) as any[]
      if (usage.length > 0) {
        return NextResponse.json({ valid: false, message: "One-time key already used" }, { status: 400 })
      }
    }

    // Check if user already exists
    const existingUsers = (await query("SELECT * FROM users WHERE telegram = ?", [telegram])) as any[]

    let user
    if (existingUsers.length > 0) {
      user = existingUsers[0]
      if (user.is_banned) {
        return NextResponse.json({ valid: false, message: "User is banned" }, { status: 403 })
      }
    } else {
      // Create new user
      const userId = Math.random().toString(36).substring(7)
      await query("INSERT INTO users (id, name, telegram, activation_key) VALUES (?, ?, ?, ?)", [
        userId,
        name,
        telegram,
        key,
      ])
      user = { id: userId, name, telegram, activation_key: key }
    }

    // Record key usage
    const usageId = Math.random().toString(36).substring(7)
    await query("INSERT INTO key_usage (id, key_code, user_id) VALUES (?, ?, ?)", [usageId, key, user.id])

    return NextResponse.json({ valid: true, user })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ valid: false, message: "Server error" }, { status: 500 })
  }
}
