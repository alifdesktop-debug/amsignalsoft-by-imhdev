"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { validateActivationCode, markActivationCodeAsUsed, saveUser, getUserByTelegram } from "@/lib/firebase-admin"
import { TrendingUp, Shield, Zap, Send, Users } from "lucide-react"
import { storeDeviceFingerprint } from "@/lib/device-fingerprint"

export default function LandingPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [telegram, setTelegram] = useState("")
  const [activationKey, setActivationKey] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isInvalidKeyError, setIsInvalidKeyError] = useState(false)

  useEffect(() => {
    const checkExistingActivation = () => {
      const storedUniqueCode = localStorage.getItem("am_unique_code")
      if (storedUniqueCode) {
        console.log("[v0] Found existing activation, redirecting to signal page:", storedUniqueCode)
        router.push(`/am-signal-software/${storedUniqueCode}`)
      }
      setIsCheckingAuth(false)
    }

    checkExistingActivation()
  }, [router])

  const handleTelegramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value

    // Remove all @ symbols first
    value = value.replace(/@/g, "")

    // Add @ at the beginning if user typed something
    if (value.length > 0) {
      value = "@" + value
    }

    setTelegram(value)
  }

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsInvalidKeyError(false)
    setLoading(true)

    // Validate inputs
    if (!name.trim() || !telegram.trim() || !activationKey.trim()) {
      setError("All fields are required")
      setIsInvalidKeyError(false)
      setLoading(false)
      return
    }

    try {
      const validKey = await validateActivationCode(activationKey)

      if (!validKey) {
        setError("Invalid or expired activation key")
        setIsInvalidKeyError(true)
        setLoading(false)
        return
      }

      const existingUser = await getUserByTelegram(telegram)
      if (existingUser) {
        setError("This Telegram account is already registered")
        setIsInvalidKeyError(false)
        setLoading(false)
        return
      }

      const uniqueCode = "UC-" + Math.random().toString(36).substring(2, 12).toUpperCase()

      const newUser = {
        id: telegram + "-" + Date.now(),
        name,
        telegram,
        activationKey,
        activatedAt: new Date().toISOString(),
        isBanned: false,
        uniqueCode,
      }

      await saveUser(newUser)

      await markActivationCodeAsUsed(validKey.id, telegram)

      console.log("[v0] User activated successfully:", newUser)

      localStorage.setItem("am_unique_code", uniqueCode)
      storeDeviceFingerprint()

      document.cookie = `am_unique_code=${uniqueCode}; path=/; max-age=${30 * 24 * 60 * 60}`

      setTimeout(() => {
        router.push(`/am-signal-software/${uniqueCode}`)
      }, 500)
    } catch (err) {
      console.error("[v0] Activation error:", err)
      setError("Activation failed. Please try again.")
      setIsInvalidKeyError(false)
      setLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex flex-col p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">AM Signal Software</h1>
          </div>
          <p className="text-blue-200 text-lg">Professional Trading Signals Platform</p>
        </div>

        <Card className="bg-slate-900/80 border-blue-900/50 backdrop-blur mb-12">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Activate Your Account</CardTitle>
            <CardDescription className="text-blue-300">Enter your details to access the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleActivate} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-blue-200">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-slate-950/50 border-blue-900/50 text-white placeholder:text-slate-500"
                  />
                  {!name.trim() && error === "All fields are required" && (
                    <p className="text-red-400 text-xs">Required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegram" className="text-blue-200">
                    Telegram Username
                  </Label>
                  <Input
                    id="telegram"
                    type="text"
                    placeholder="@username"
                    value={telegram}
                    onChange={handleTelegramChange}
                    className="bg-slate-950/50 border-blue-900/50 text-white placeholder:text-slate-500"
                  />
                  {!telegram.trim() && error === "All fields are required" && (
                    <p className="text-red-400 text-xs">Required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="key" className="text-blue-200">
                    Activation Key
                  </Label>
                  <Input
                    id="key"
                    type="text"
                    placeholder="AM-XXXXX"
                    value={activationKey}
                    onChange={(e) => setActivationKey(e.target.value)}
                    className="bg-slate-950/50 border-blue-900/50 text-white placeholder:text-slate-500"
                  />
                  {!activationKey.trim() && error === "All fields are required" && (
                    <p className="text-red-400 text-xs">Required</p>
                  )}
                </div>
              </div>

              {error && isInvalidKeyError && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-red-900/50 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                    <div className="text-center space-y-4">
                      <h3 className="text-xl font-bold text-red-400">Invalid or expired activation key</h3>
                      <p className="text-slate-300 text-sm">To Get Correct Activation Key Contract Admin Now</p>

                      <a
                        href="https://t.me/AMTRADER999"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group inline-block w-full mt-6"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
                        <button className="relative w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-blue-500/50">
                          <span>Contract Admin Now</span>
                          <svg
                            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </button>
                      </a>

                      <button
                        onClick={() => {
                          setError("")
                          setIsInvalidKeyError(false)
                        }}
                        className="w-full text-slate-400 hover:text-slate-300 text-sm py-2 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {error && !isInvalidKeyError && (
                <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                {loading ? "Activating..." : "Activate Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">How To Get Activation Code</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <a
              href="https://t.me/AMTRADER999"
              target="_blank"
              rel="noopener noreferrer"
              className="relative group overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:animate-pulse transition-opacity duration-300"></div>

              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">Contract Our Admin To Get Activation Code</p>
                </div>
              </div>
            </a>

            <a
              href="https://t.me/AMTRADERBACK"
              target="_blank"
              rel="noopener noreferrer"
              className="relative group overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 hover:shadow-lg hover:shadow-emerald-500/50 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:animate-pulse transition-opacity duration-300"></div>

              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">Join Telegram Community</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-8 text-center">What You'll Get</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-slate-900/50 border-blue-900/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Live Signals</CardTitle>
                    <CardDescription className="text-blue-300">
                      Real-time trading signals with proper analysis
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 border-blue-900/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Future Signals</CardTitle>
                    <CardDescription className="text-blue-300">7 advanced signals at once</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 border-blue-900/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Market Analysis</CardTitle>
                    <CardDescription className="text-blue-300">OTC market support</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
