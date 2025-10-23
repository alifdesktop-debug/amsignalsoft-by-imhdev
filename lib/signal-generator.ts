export type SignalDirection = "BUY" | "SELL"

export interface Signal {
  id: string
  pair: string
  direction: SignalDirection
  entryPrice: number
  targetPrice: number
  stopLoss: number
  entryTime: string // Time when signal entry should happen
  duration: number // Duration in minutes (1-5)
  confidence: number
  timestamp: string
}

export function generateSignal(pairName: string): Signal {
  const direction: SignalDirection = Math.random() > 0.5 ? "BUY" : "SELL"
  const entryPrice = 1.0 + Math.random() * 0.5
  const priceChange = 0.001 + Math.random() * 0.005

  const targetPrice = direction === "BUY" ? entryPrice + priceChange : entryPrice - priceChange
  const stopLoss = direction === "BUY" ? entryPrice - priceChange * 0.5 : entryPrice + priceChange * 0.5

  const entryTimeMinutes = 1 + Math.floor(Math.random() * 5)
  const entryTimeDate = new Date(Date.now() + entryTimeMinutes * 60000)

  const duration = 1 + Math.floor(Math.random() * 5)

  return {
    id: Math.random().toString(36).substring(7),
    pair: pairName,
    direction,
    entryPrice: Number.parseFloat(entryPrice.toFixed(5)),
    targetPrice: Number.parseFloat(targetPrice.toFixed(5)),
    stopLoss: Number.parseFloat(stopLoss.toFixed(5)),
    entryTime: entryTimeDate.toISOString(),
    duration,
    confidence: 75 + Math.floor(Math.random() * 20),
    timestamp: new Date().toISOString(),
  }
}

export function generateMultipleSignals(pairName: string, count: number): Signal[] {
  const signals: Signal[] = []
  const startTimeMinutes = 10 // Start 10 minutes from now
  const totalSpanMinutes = 300 // 5 hours
  const intervalMinutes = Math.floor(totalSpanMinutes / (count - 1)) // Evenly space signals

  for (let i = 0; i < count; i++) {
    const direction: SignalDirection = Math.random() > 0.5 ? "BUY" : "SELL"
    const entryPrice = 1.0 + Math.random() * 0.5
    const priceChange = 0.001 + Math.random() * 0.005

    const targetPrice = direction === "BUY" ? entryPrice + priceChange : entryPrice - priceChange
    const stopLoss = direction === "BUY" ? entryPrice - priceChange * 0.5 : entryPrice + priceChange * 0.5

    // Calculate entry time for this signal
    const entryTimeMinutesFromNow = startTimeMinutes + i * intervalMinutes
    const entryTimeDate = new Date(Date.now() + entryTimeMinutesFromNow * 60000)

    const duration = 1 + Math.floor(Math.random() * 5)

    signals.push({
      id: Math.random().toString(36).substring(7),
      pair: pairName,
      direction,
      entryPrice: Number.parseFloat(entryPrice.toFixed(5)),
      targetPrice: Number.parseFloat(targetPrice.toFixed(5)),
      stopLoss: Number.parseFloat(stopLoss.toFixed(5)),
      entryTime: entryTimeDate.toISOString(),
      duration,
      confidence: 75 + Math.floor(Math.random() * 20),
      timestamp: new Date().toISOString(),
    })
  }

  return signals
}
