import { query, checkMarketCooldown, setMarketCooldown } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, pair, signalType, signals } = await request.json()

    const cooldownUntil = await checkMarketCooldown(userId, pair)
    if (cooldownUntil) {
      console.log("[v0] Market cooldown exists until:", cooldownUntil)
      return NextResponse.json(
        {
          success: false,
          message: `Market ${pair} is in cooldown until ${cooldownUntil}. Please wait before generating another signal.`,
          cooldownUntil,
        },
        { status: 429 },
      )
    }

    if (signalType === "live" && signals.length > 0) {
      const signal = signals[0]
      const signalId = Math.random().toString(36).substring(7)

      console.log("[v0] Saving live signal:", {
        signalId,
        pair,
        entryTime: signal.entryTime,
        duration: signal.duration,
      })

      await query(
        `INSERT INTO signal_history 
         (id, user_id, pair, signal_type, entry_time, duration, mtg_target, confidence) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [signalId, userId, pair, "live", new Date(signal.entryTime), signal.duration, signal.target, signal.confidence],
      )

      const cooldownUntil = new Date(signal.entryTime)
      cooldownUntil.setMinutes(cooldownUntil.getMinutes() + signal.duration)

      console.log("[v0] Setting cooldown until:", cooldownUntil)
      await setMarketCooldown(userId, pair, cooldownUntil, "live")
    } else if (signalType === "future" && signals.length > 0) {
      const batchId = Math.random().toString(36).substring(7)

      console.log("[v0] Saving future signals batch:", { batchId, pair, count: signals.length })

      for (let i = 0; i < signals.length; i++) {
        const signal = signals[i]
        const signalId = Math.random().toString(36).substring(7)

        await query(
          `INSERT INTO future_signals 
           (id, batch_id, user_id, pair, signal_number, entry_time, duration, mtg_target, confidence) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            signalId,
            batchId,
            userId,
            pair,
            i + 1,
            new Date(signal.entryTime),
            signal.duration,
            signal.target,
            signal.confidence,
          ],
        )
      }

      const lastSignal = signals[signals.length - 1]
      const cooldownUntil = new Date(lastSignal.entryTime)
      cooldownUntil.setMinutes(cooldownUntil.getMinutes() + lastSignal.duration)

      console.log("[v0] Setting cooldown until:", cooldownUntil)
      await setMarketCooldown(userId, pair, cooldownUntil, "future")
    }

    console.log("[v0] Signal saved successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Signal save error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
