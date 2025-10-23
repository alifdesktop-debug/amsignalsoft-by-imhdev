import { checkMarketCooldown } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const pair = searchParams.get("pair")

    if (!userId || !pair) {
      return NextResponse.json({ success: false, message: "Missing parameters" }, { status: 400 })
    }

    console.log("[v0] Checking cooldown for:", { userId, pair })
    const cooldownUntil = await checkMarketCooldown(userId, pair)
    console.log("[v0] Cooldown result:", cooldownUntil)

    return NextResponse.json({
      success: true,
      cooldownUntil: cooldownUntil || null,
    })
  } catch (error) {
    console.error("[v0] Cooldown check error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
