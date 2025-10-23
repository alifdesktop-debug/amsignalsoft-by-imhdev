"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { getUserByUniqueCode } from "@/lib/firebase-admin"
import type { User, SignalEntry } from "@/lib/firebase-admin"
import { currencyPairs, getMarketStatus, formatPairName } from "@/lib/currency-pairs"
import type { Signal } from "@/lib/signal-generator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, History, Eye, EyeOff } from "lucide-react"
import { TerminalAnimation } from "@/components/terminal-animation"
import { SignalCard } from "@/components/signal-card"
import { generateSignal, generateMultipleSignals } from "@/lib/signal-generator"
import { getMarketsByCategory } from "@/lib/currency-pairs"
import { verifyDeviceFingerprint } from "@/lib/device-fingerprint"

export default function SignalDashboard() {
  const router = useRouter()
  const params = useParams()
  const uniqueCode = params.uniquecode as string

  const [user, setUser] = useState<User | null>(null)
  const [selectedPair, setSelectedPair] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [signals, setSignals] = useState<Signal[]>([])
  const [signalType, setSignalType] = useState<"live" | "future" | null>(null)
  const [marketCooldowns, setMarketCooldowns] = useState<Record<string, Record<"live" | "future", number>>>({})
  const [view, setView] = useState<"generate" | "history">("generate")
  const [signalHistory, setSignalHistory] = useState<SignalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showSessionInfo, setShowSessionInfo] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<"currencies" | "commodities" | "stocks">("currencies")
  const cooldownIntervalsRef = useRef<Record<string, Record<"live" | "future", NodeJS.Timeout>>>({})

  useEffect(() => {
    if (!selectedPair) return

    const loadCooldownFromStorage = () => {
      const storedCooldowns = localStorage.getItem(`cooldowns_${uniqueCode}`)
      if (storedCooldowns) {
        const cooldowns = JSON.parse(storedCooldowns)
        const pairCooldowns = cooldowns[selectedPair]

        if (pairCooldowns) {
          const now = Date.now()
          const liveCooldownExpiry = pairCooldowns.live
          const futureCooldownExpiry = pairCooldowns.future

          const liveCooldownMs = liveCooldownExpiry ? Math.max(0, liveCooldownExpiry - now) : 0
          const futureCooldownMs = futureCooldownExpiry ? Math.max(0, futureCooldownExpiry - now) : 0

          const liveRemainingSeconds = Math.max(0, Math.ceil(liveCooldownMs / 1000))
          const futureRemainingSeconds = Math.max(0, Math.ceil(futureCooldownMs / 1000))

          console.log(
            `[v0] Pair: ${selectedPair}, Live cooldown: ${liveRemainingSeconds}s, Future cooldown: ${futureRemainingSeconds}s`,
          )

          setMarketCooldowns((prev) => ({
            ...prev,
            [selectedPair]: {
              live: liveRemainingSeconds,
              future: futureRemainingSeconds,
            },
          }))

          if (!cooldownIntervalsRef.current[selectedPair]) {
            cooldownIntervalsRef.current[selectedPair] = { live: undefined as any, future: undefined as any }
          }

          // Live signal cooldown
          if (liveRemainingSeconds > 0) {
            if (cooldownIntervalsRef.current[selectedPair].live) {
              clearInterval(cooldownIntervalsRef.current[selectedPair].live)
            }

            let countdown = liveRemainingSeconds
            const interval = setInterval(() => {
              countdown--
              setMarketCooldowns((prev) => ({
                ...prev,
                [selectedPair]: {
                  ...prev[selectedPair],
                  live: Math.max(0, countdown),
                },
              }))

              if (countdown <= 0) {
                clearInterval(interval)
                delete cooldownIntervalsRef.current[selectedPair].live
                // Remove from localStorage when expired
                const stored = localStorage.getItem(`cooldowns_${uniqueCode}`)
                if (stored) {
                  const cooldowns = JSON.parse(stored)
                  if (cooldowns[selectedPair]) {
                    cooldowns[selectedPair].live = null
                    localStorage.setItem(`cooldowns_${uniqueCode}`, JSON.stringify(cooldowns))
                  }
                }
              }
            }, 1000)

            cooldownIntervalsRef.current[selectedPair].live = interval
          }

          // Future signal cooldown
          if (futureRemainingSeconds > 0) {
            if (cooldownIntervalsRef.current[selectedPair].future) {
              clearInterval(cooldownIntervalsRef.current[selectedPair].future)
            }

            let countdown = futureRemainingSeconds
            const interval = setInterval(() => {
              countdown--
              setMarketCooldowns((prev) => ({
                ...prev,
                [selectedPair]: {
                  ...prev[selectedPair],
                  future: Math.max(0, countdown),
                },
              }))

              if (countdown <= 0) {
                clearInterval(interval)
                delete cooldownIntervalsRef.current[selectedPair].future
                // Remove from localStorage when expired
                const stored = localStorage.getItem(`cooldowns_${uniqueCode}`)
                if (stored) {
                  const cooldowns = JSON.parse(stored)
                  if (cooldowns[selectedPair]) {
                    cooldowns[selectedPair].future = null
                    localStorage.setItem(`cooldowns_${uniqueCode}`, JSON.stringify(cooldowns))
                  }
                }
              }
            }, 1000)

            cooldownIntervalsRef.current[selectedPair].future = interval
          }
        }
      }
    }

    loadCooldownFromStorage()

    return () => {
      if (cooldownIntervalsRef.current[selectedPair]) {
        if (cooldownIntervalsRef.current[selectedPair].live) {
          clearInterval(cooldownIntervalsRef.current[selectedPair].live)
        }
        if (cooldownIntervalsRef.current[selectedPair].future) {
          clearInterval(cooldownIntervalsRef.current[selectedPair].future)
        }
      }
    }
  }, [selectedPair, uniqueCode])

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (!verifyDeviceFingerprint()) {
          console.log("[v0] Device fingerprint mismatch, redirecting to unauthorized device page")
          router.push("/unauthorized-device")
          return
        }

        const foundUser = await getUserByUniqueCode(uniqueCode)

        if (!foundUser) {
          localStorage.removeItem(`am_unique_code`)
          localStorage.removeItem(`cooldowns_${uniqueCode}`)
          localStorage.removeItem(`history_${uniqueCode}`)
          localStorage.removeItem(`am_device_fingerprint`)

          // Redirect to login page
          router.push("/")
          return
        }

        if (foundUser.isBanned) {
          router.push("/yourban")
          return
        }

        setUser(foundUser)

        const storedHistory = localStorage.getItem(`history_${uniqueCode}`)
        if (storedHistory) {
          try {
            const history = JSON.parse(storedHistory)
            setSignalHistory(history)
          } catch (e) {
            console.error("[v0] Error parsing history from localStorage:", e)
            setSignalHistory([])
          }
        } else {
          setSignalHistory([])
        }

        setLoading(false)
      } catch (error) {
        console.error("[v0] Error loading user:", error)
        localStorage.removeItem(`am_unique_code`)
        localStorage.removeItem(`cooldowns_${uniqueCode}`)
        localStorage.removeItem(`history_${uniqueCode}`)
        localStorage.removeItem(`am_device_fingerprint`)
        router.push("/")
      }
    }

    loadUser()
  }, [router, uniqueCode])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  const selectedPairData = currencyPairs.find((p) => p.id === selectedPair)
  const marketStatus = selectedPairData ? getMarketStatus(selectedPairData.type) : null
  const pairCooldowns = selectedPair ? marketCooldowns[selectedPair] : { live: 0, future: 0 }
  const liveCooldown = pairCooldowns?.live || 0
  const futureCooldown = pairCooldowns?.future || 0

  const handleGenerateSignal = async (type: "live" | "future") => {
    if (!selectedPair || !user) return

    const currentCooldown = type === "live" ? liveCooldown : futureCooldown
    if (currentCooldown > 0) {
      alert(
        `This market is in cooldown for ${type} signals. Please wait ${currentCooldown} seconds before generating another signal.`,
      )
      return
    }

    setIsGenerating(true)
    setSignalType(type)
    setSignals([])
  }

  const handleTerminalComplete = async () => {
    if (!selectedPair || !user) return

    let generatedSignals: Signal[]
    if (signalType === "live") {
      generatedSignals = [generateSignal(selectedPair)]
    } else {
      generatedSignals = generateMultipleSignals(selectedPair, 7)
    }

    setSignals(generatedSignals)
    setIsGenerating(false)

    const historyEntry: SignalEntry = {
      id: Math.random().toString(36).substring(7),
      userId: user.id,
      pair: selectedPair,
      type: signalType || "live",
      signals: generatedSignals,
      generatedAt: new Date().toISOString(),
    }

    try {
      const firstSignal = generatedSignals[0]
      const lastSignal = generatedSignals[generatedSignals.length - 1]

      let cooldownMs: number

      if (signalType === "future") {
        const firstEntryTime = new Date(firstSignal.entryTime).getTime()
        const lastEntryTime = new Date(lastSignal.entryTime).getTime()
        const timeSpanMs = lastEntryTime - firstEntryTime
        const lastSignalDuration = lastSignal.duration || 30
        const totalCooldownMs = timeSpanMs + lastSignalDuration * 60 * 1000
        cooldownMs = totalCooldownMs

        const cooldownMinutes = Math.ceil(cooldownMs / (60 * 1000))
        const timeSpanMinutes = Math.ceil(timeSpanMs / (60 * 1000))

        console.log(
          `[v0] Setting future signal cooldown: ${cooldownMinutes} minutes (${timeSpanMinutes}min span + ${lastSignalDuration}min duration)`,
        )
        console.log(`[v0] First entry: ${new Date(firstEntryTime).toLocaleTimeString()}`)
        console.log(`[v0] Last entry: ${new Date(lastEntryTime).toLocaleTimeString()}`)
      } else {
        const entryTimeDate = new Date(firstSignal.entryTime)
        const now = new Date()
        const entryTimeMinutes = Math.ceil((entryTimeDate.getTime() - now.getTime()) / (60 * 1000))
        const duration = firstSignal.duration || 30
        const cooldownMinutes = entryTimeMinutes + duration
        cooldownMs = cooldownMinutes * 60 * 1000

        console.log(
          `[v0] Setting live signal cooldown for ${selectedPair}: ${cooldownMinutes} minutes (${entryTimeMinutes}min entry + ${duration}min duration)`,
        )
      }

      const cooldownExpiry = Date.now() + cooldownMs

      console.log(`[v0] Cooldown expires at: ${new Date(cooldownExpiry).toLocaleTimeString()}`)

      const storedCooldowns = localStorage.getItem(`cooldowns_${uniqueCode}`)
      const cooldowns = storedCooldowns ? JSON.parse(storedCooldowns) : {}

      if (!cooldowns[selectedPair]) {
        cooldowns[selectedPair] = { live: null, future: null }
      }

      cooldowns[selectedPair][signalType || "live"] = cooldownExpiry
      localStorage.setItem(`cooldowns_${uniqueCode}`, JSON.stringify(cooldowns))

      setMarketCooldowns((prev) => ({
        ...prev,
        [selectedPair]: {
          ...prev[selectedPair],
          [signalType || "live"]: Math.ceil(cooldownMs / 1000),
        },
      }))

      if (!cooldownIntervalsRef.current[selectedPair]) {
        cooldownIntervalsRef.current[selectedPair] = { live: undefined as any, future: undefined as any }
      }

      if (cooldownIntervalsRef.current[selectedPair][signalType || "live"]) {
        clearInterval(cooldownIntervalsRef.current[selectedPair][signalType || "live"])
      }

      let countdown = Math.ceil(cooldownMs / 1000)
      const interval = setInterval(() => {
        countdown--
        setMarketCooldowns((prev) => ({
          ...prev,
          [selectedPair]: {
            ...prev[selectedPair],
            [signalType || "live"]: Math.max(0, countdown),
          },
        }))

        if (countdown <= 0) {
          clearInterval(interval)
          delete cooldownIntervalsRef.current[selectedPair][signalType || "live"]
        }
      }, 1000)

      cooldownIntervalsRef.current[selectedPair][signalType || "live"] = interval

      setSignalHistory((prev) => {
        const updated = [historyEntry, ...prev]
        localStorage.setItem(`history_${uniqueCode}`, JSON.stringify(updated))
        return updated
      })

      console.log("[v0] Signal entry saved to localStorage")
    } catch (error) {
      console.error("[v0] Error saving signal entry:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <header className="border-b border-blue-900/50 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AM Signal Software</h1>
              <p className="text-sm text-blue-300">Welcome, {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setView(view === "generate" ? "history" : "generate")}
              className={`${
                view === "history"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "border-blue-900/50 text-blue-300 hover:bg-blue-950/50 bg-transparent"
              }`}
              variant={view === "history" ? "default" : "outline"}
            >
              <History className="w-4 h-4 mr-2" />
              {view === "history" ? "Back to Generate" : "History"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {view === "generate" ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-slate-900/80 border-blue-900/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Select Market</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => {
                        setSelectedCategory("currencies")
                        setSelectedPair("")
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === "currencies"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-blue-300 hover:bg-slate-700"
                      }`}
                    >
                      Currencies
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCategory("commodities")
                        setSelectedPair("")
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === "commodities"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-blue-300 hover:bg-slate-700"
                      }`}
                    >
                      Commodities
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCategory("stocks")
                        setSelectedPair("")
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === "stocks"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-blue-300 hover:bg-slate-700"
                      }`}
                    >
                      Stocks
                    </button>
                  </div>

                  <Select value={selectedPair} onValueChange={setSelectedPair}>
                    <SelectTrigger className="bg-slate-950/50 border-blue-900/50 text-white">
                      <SelectValue placeholder="Choose a market" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-blue-900/50">
                      {getMarketsByCategory(selectedCategory).map((market) => (
                        <SelectItem key={market.id} value={market.id} className="text-white">
                          {market.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedPairData && (
                    <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg">
                      <span className="text-blue-300 text-sm">Market Status</span>
                      <Badge variant="default" className="bg-emerald-600">
                        Open
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      onClick={() => handleGenerateSignal("live")}
                      disabled={!selectedPair || isGenerating || liveCooldown > 0}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {liveCooldown > 0
                        ? `Cooldown: ${Math.floor(liveCooldown / 60)}m ${liveCooldown % 60}s`
                        : "Generate Live Signal"}
                    </Button>

                    <Button
                      onClick={() => handleGenerateSignal("future")}
                      disabled={!selectedPair || isGenerating || futureCooldown > 0}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {futureCooldown > 0
                        ? `Cooldown: ${Math.floor(futureCooldown / 60)}m ${futureCooldown % 60}s`
                        : "Generate Future Signals (7)"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/80 border-blue-900/50 backdrop-blur">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-sm">Session Info</CardTitle>
                    <button
                      onClick={() => setShowSessionInfo(!showSessionInfo)}
                      className="p-1 hover:bg-slate-800 rounded transition-colors"
                      aria-label={showSessionInfo ? "Hide session info" : "Show session info"}
                    >
                      {showSessionInfo ? (
                        <Eye className="w-4 h-4 text-blue-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  </div>
                </CardHeader>
                {showSessionInfo && (
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-300">Telegram</span>
                      <span className="text-white">@{user.telegram}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-300">Key</span>
                      <span className="text-white font-mono text-xs">{user.activationKey}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-300">Unique Code</span>
                      <span className="text-white font-mono text-xs">{uniqueCode}</span>
                    </div>
                    {user.keyType && (
                      <div className="flex justify-between items-center">
                        <span className="text-blue-300">Key Type</span>
                        <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs">
                          {user.keyType === "one-time"
                            ? "ONE TIME"
                            : user.keyType === "unlimited"
                              ? "UNLIMITED"
                              : "USER LIMIT"}
                        </Badge>
                      </div>
                    )}
                    {user.maxUsers && (
                      <div className="flex justify-between">
                        <span className="text-blue-300">Max Users</span>
                        <span className="text-white font-mono">{user.maxUsers}</span>
                      </div>
                    )}
                    {user.keyType === "one-time" && (
                      <div className="flex justify-between">
                        <span className="text-blue-300">Max Users</span>
                        <span className="text-white font-mono">1</span>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </div>

            <div className="lg:col-span-2">
              {isGenerating && signalType && (
                <TerminalAnimation type={signalType} onComplete={handleTerminalComplete} />
              )}

              {!isGenerating && signals.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-white">
                    {signals.length === 1 ? "Live Signal" : "Future Signals"}
                  </h2>
                  <div className="grid gap-4">
                    {signals.map((signal) => (
                      <SignalCard key={signal.id} signal={signal} />
                    ))}
                  </div>
                </div>
              )}

              {!isGenerating && signals.length === 0 && (
                <Card className="bg-slate-900/80 border-blue-900/50 backdrop-blur">
                  <CardContent className="py-16 text-center">
                    <TrendingUp className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Signals Yet</h3>
                    <p className="text-blue-300">Select a currency pair and generate signals to get started</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Signal History</h2>
            {signalHistory.length === 0 ? (
              <Card className="bg-slate-900/80 border-blue-900/50 backdrop-blur">
                <CardContent className="py-16 text-center">
                  <History className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No History Yet</h3>
                  <p className="text-blue-300">Generate signals to see them here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {signalHistory.map((entry) => (
                  <Card key={entry.id} className="bg-slate-900/80 border-blue-900/50 backdrop-blur">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white">{formatPairName(entry.pair)}</CardTitle>
                          <p className="text-sm text-blue-300 mt-1">{new Date(entry.generatedAt).toLocaleString()}</p>
                        </div>
                        <Badge
                          className={entry.type === "live" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"}
                        >
                          {entry.type === "live" ? "Live Signal" : "Future Signals"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {entry.signals.map((signal: Signal) => (
                          <SignalCard key={signal.id} signal={signal} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
