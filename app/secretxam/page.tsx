"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  saveActivationKey,
  deleteActivationKey,
  generateActivationKey,
  type ActivationKey,
  banUser,
  unbanUser,
  deleteUser,
  type User,
  onActivationKeysChange,
  onUsersChange,
} from "@/lib/firebase-admin"
import { Key, Trash2, Plus, Users, Ban, RotateCcw, Search, LogOut } from "lucide-react"
import { parseExpirationString } from "@/lib/expiration-parser"

function calculateTimeRemaining(expiresAt: string): { remaining: string; isExpired: boolean } {
  const now = new Date()
  const expirationDate = new Date(expiresAt)
  const diffMs = expirationDate.getTime() - now.getTime()

  if (diffMs <= 0) {
    return { remaining: "Expired", isExpired: true }
  }

  const diffSecs = Math.floor(diffMs / 1000)
  const days = Math.floor(diffSecs / 86400)
  const hours = Math.floor((diffSecs % 86400) / 3600)
  const minutes = Math.floor((diffSecs % 3600) / 60)
  const seconds = diffSecs % 60

  if (days > 0) {
    return { remaining: `${days}d ${hours}h`, isExpired: false }
  } else if (hours > 0) {
    return { remaining: `${hours}h ${minutes}m`, isExpired: false }
  } else if (minutes > 0) {
    return { remaining: `${minutes}m ${seconds}s`, isExpired: false }
  } else {
    return { remaining: `${seconds}s`, isExpired: false }
  }
}

export default function AdminPanel() {
  const router = useRouter()
  const [keys, setKeys] = useState<ActivationKey[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [keyType, setKeyType] = useState<"one-time" | "unlimited" | "user-limit">("one-time")
  const [expirationInput, setExpirationInput] = useState("")
  const [customKeyInput, setCustomKeyInput] = useState("")
  const [useCustomKey, setUseCustomKey] = useState(false)
  const [maxUsersInput, setMaxUsersInput] = useState("")
  const [activeTab, setActiveTab] = useState<"keys" | "users" | "search">("users")
  const [loading, setLoading] = useState(true)
  const [generatingKey, setGeneratingKey] = useState(false)
  const [keyMessage, setKeyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [, setCountdownTrigger] = useState(0)
  const [keyFilter, setKeyFilter] = useState<"all" | "active" | "expire">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searchType, setSearchType] = useState<"telegram" | "key">("telegram")
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    action: () => Promise<void>
    isLoading?: boolean
  } | null>(null)

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("adminAuthenticated")
    if (!isAuthenticated) {
      router.push("/secretxam/login")
    }
  }, [router])

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownTrigger((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setLoading(true)

    const unsubscribeKeys = onActivationKeysChange((updatedKeys) => {
      setKeys(updatedKeys)
      setLoading(false)
    })

    const unsubscribeUsers = onUsersChange((updatedUsers) => {
      setUsers(updatedUsers)
      setLoading(false)
    })

    return () => {
      unsubscribeKeys()
      unsubscribeUsers()
    }
  }, [])

  const getFilteredKeys = () => {
    return keys.filter((key) => {
      const timeInfo = key.expiresAt ? calculateTimeRemaining(key.expiresAt) : null

      if (keyFilter === "active") {
        return !timeInfo?.isExpired
      } else if (keyFilter === "expire") {
        return timeInfo?.isExpired
      }
      return true // "all"
    })
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const query = searchQuery.trim().toLowerCase()
    const results = users.filter((user) => {
      if (searchType === "telegram") {
        return user.telegram.toLowerCase().includes(query)
      } else {
        return user.activationKey.toLowerCase().includes(query)
      }
    })
    setSearchResults(results)
  }

  const handleBanAllByKey = async () => {
    if (searchType !== "key" || !searchQuery.trim()) return

    const query = searchQuery.trim().toLowerCase()
    const usersToban = users.filter((user) => user.activationKey.toLowerCase() === query)

    if (usersToban.length === 0) {
      alert("No users found with this key")
      return
    }

    showConfirmation(
      "Ban All Users",
      `Are you sure you want to ban all ${usersToban.length} users with this key?`,
      async () => {
        for (const user of usersToban) {
          await banUser(user.id)
        }
      },
    )
  }

  const handleUnbanAllByKey = async () => {
    if (searchType !== "key" || !searchQuery.trim()) return

    const query = searchQuery.trim().toLowerCase()
    const usersToUnban = users.filter((user) => user.activationKey.toLowerCase() === query)

    if (usersToUnban.length === 0) {
      alert("No users found with this key")
      return
    }

    showConfirmation(
      "Unban All Users",
      `Are you sure you want to unban all ${usersToUnban.length} users with this key?`,
      async () => {
        for (const user of usersToUnban) {
          await unbanUser(user.id)
        }
      },
    )
  }

  const handleDeleteAllByKey = async () => {
    if (searchType !== "key" || !searchQuery.trim()) return

    const query = searchQuery.trim().toLowerCase()
    const usersToDelete = users.filter((user) => user.activationKey.toLowerCase() === query)

    if (usersToDelete.length === 0) {
      alert("No users found with this key")
      return
    }

    showConfirmation(
      "Delete All Users",
      `Are you sure you want to delete all ${usersToDelete.length} users with this key? This action cannot be undone.`,
      async () => {
        for (const user of usersToDelete) {
          await deleteUser(user.id)
        }
      },
    )
  }

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated")
    localStorage.removeItem("adminLoginTime")
    router.push("/secretxam/login")
  }

  const showConfirmation = (title: string, description: string, action: () => Promise<void>) => {
    setConfirmDialog({ isOpen: true, title, description, action })
  }

  const handleConfirmAction = async () => {
    if (confirmDialog) {
      try {
        setConfirmDialog({ ...confirmDialog, isLoading: true })
        await confirmDialog.action()
        setConfirmDialog(null)
        handleSearch() // Refresh search results
      } catch (error) {
        console.error("[v0] Error executing action:", error)
        alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
        setConfirmDialog(null)
      }
    }
  }

  const handleCreateKey = async () => {
    try {
      setGeneratingKey(true)
      setKeyMessage(null)
      console.log("[v0] Starting key generation...")

      let expiresAt: string | null = null
      if (expirationInput.trim()) {
        try {
          const expirationDate = parseExpirationString(expirationInput)
          expiresAt = expirationDate.toISOString()
        } catch (error) {
          setKeyMessage({
            type: "error",
            text: `Invalid expiration format: ${error instanceof Error ? error.message : "Unknown error"}`,
          })
          setGeneratingKey(false)
          return
        }
      }

      let keyValue: string
      if (useCustomKey) {
        if (!customKeyInput.trim()) {
          setKeyMessage({ type: "error", text: "Please enter a custom key" })
          setGeneratingKey(false)
          return
        }
        // Check if custom key already exists
        const keyExists = keys.some((k) => k.key.toUpperCase() === customKeyInput.trim().toUpperCase())
        if (keyExists) {
          setKeyMessage({ type: "error", text: "This key already exists" })
          setGeneratingKey(false)
          return
        }
        keyValue = customKeyInput.trim().toUpperCase()
      } else {
        keyValue = generateActivationKey()
      }

      let maxUsers: number | null = null
      if (keyType === "one-time") {
        maxUsers = 1
      } else if (keyType === "user-limit") {
        if (!maxUsersInput.trim()) {
          setKeyMessage({ type: "error", text: "Max users is required for USER LIMIT key type" })
          setGeneratingKey(false)
          return
        }
        const parsedMax = Number.parseInt(maxUsersInput.trim(), 10)
        if (isNaN(parsedMax) || parsedMax < 1) {
          setKeyMessage({ type: "error", text: "Max users must be a positive number" })
          setGeneratingKey(false)
          return
        }
        maxUsers = parsedMax
      } else if (maxUsersInput.trim()) {
        const parsedMax = Number.parseInt(maxUsersInput.trim(), 10)
        if (isNaN(parsedMax) || parsedMax < 1) {
          setKeyMessage({ type: "error", text: "Max users must be a positive number" })
          setGeneratingKey(false)
          return
        }
        maxUsers = parsedMax
      }

      const newKey: ActivationKey = {
        id: Math.random().toString(36).substring(7),
        key: keyValue,
        type: keyType,
        expiresAt,
        usedBy: [],
        createdAt: new Date().toISOString(),
        maxUsers,
      }

      console.log("[v0] Generated key object:", newKey)
      await saveActivationKey(newKey)
      console.log("[v0] Key saved successfully")

      setKeyMessage({ type: "success", text: `Key ${newKey.key} created successfully!` })
      setExpirationInput("")
      setCustomKeyInput("")
      setMaxUsersInput("")
      setUseCustomKey(false)
      setTimeout(() => setKeyMessage(null), 3000)
    } catch (error) {
      console.error("[v0] Error creating key:", error)
      setKeyMessage({ type: "error", text: `Error: ${error instanceof Error ? error.message : "Unknown error"}` })
    } finally {
      setGeneratingKey(false)
    }
  }

  const handleDeleteKey = async (id: string) => {
    await deleteActivationKey(id)
  }

  const handleBanUser = async (userId: string) => {
    showConfirmation("Ban User", "Are you sure you want to ban this user?", async () => {
      await banUser(userId)
    })
  }

  const handleUnbanUser = async (userId: string) => {
    showConfirmation("Unban User", "Are you sure you want to unban this user?", async () => {
      await unbanUser(userId)
    })
  }

  const handleDeleteUser = async (userId: string) => {
    showConfirmation(
      "Delete User",
      "Are you sure you want to delete this user? This action cannot be undone.",
      async () => {
        await deleteUser(userId)
      },
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading Firebase data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-4">
      <div className="container mx-auto max-w-6xl py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-blue-300">Manage activation keys and users for AM Signal Software</p>
            <p className="text-sm text-emerald-400 mt-2">Connected to Firebase Realtime Database</p>
          </div>
          <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white" title="Logout">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-blue-900/50">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "users" ? "text-blue-400 border-b-2 border-blue-400" : "text-blue-300 hover:text-blue-200"
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("keys")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "keys" ? "text-blue-400 border-b-2 border-blue-400" : "text-blue-300 hover:text-blue-200"
            }`}
          >
            <Key className="w-4 h-4 inline mr-2" />
            Keys ({keys.length})
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "search" ? "text-blue-400 border-b-2 border-blue-400" : "text-blue-300 hover:text-blue-200"
            }`}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Search
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {users.length === 0 ? (
              <Card className="bg-slate-900/80 border-blue-900/50 backdrop-blur">
                <CardContent className="py-8 text-center text-blue-300">No users yet</CardContent>
              </Card>
            ) : (
              users.map((user) => (
                <Card key={user.id} className="bg-slate-900/80 border-blue-900/50 backdrop-blur">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-white font-semibold">{user.name}</h3>
                          {user.isBanned && <Badge className="bg-red-600 text-white">Banned</Badge>}
                        </div>
                        <div className="text-sm text-blue-300 space-y-1">
                          <p>Telegram: @{user.telegram}</p>
                          <p>Key: {user.activationKey}</p>
                          <p>Activated: {new Date(user.activatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {user.isBanned ? (
                          <Button
                            size="sm"
                            onClick={() => handleUnbanUser(user.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            title="Unban"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleBanUser(user.id)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            title="Ban"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Keys Tab */}
        {activeTab === "keys" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="bg-slate-900/80 border-blue-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create New Key
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {keyMessage && (
                  <div
                    className={`p-3 rounded text-sm font-medium ${
                      keyMessage.type === "success"
                        ? "bg-emerald-900/50 text-emerald-200 border border-emerald-700"
                        : "bg-red-900/50 text-red-200 border border-red-700"
                    }`}
                  >
                    {keyMessage.text}
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-blue-200">Key Type</Label>
                  <Select
                    value={keyType}
                    onValueChange={(v) => setKeyType(v as "one-time" | "unlimited" | "user-limit")}
                  >
                    <SelectTrigger className="bg-slate-950/50 border-blue-900/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-blue-900/50">
                      <SelectItem value="one-time" className="text-white">
                        One-Time Use
                      </SelectItem>
                      <SelectItem value="unlimited" className="text-white">
                        Unlimited Use
                      </SelectItem>
                      <SelectItem value="user-limit" className="text-white">
                        User Limit
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useCustomKey"
                      checked={useCustomKey}
                      onChange={(e) => setUseCustomKey(e.target.checked)}
                      className="w-4 h-4 rounded border-blue-900/50 bg-slate-950/50 cursor-pointer"
                    />
                    <Label htmlFor="useCustomKey" className="text-blue-200 cursor-pointer">
                      Use Custom Key
                    </Label>
                  </div>
                  {useCustomKey && (
                    <Input
                      type="text"
                      placeholder="Enter custom key (e.g., PREMIUM-001)"
                      value={customKeyInput}
                      onChange={(e) => setCustomKeyInput(e.target.value)}
                      className="bg-slate-950/50 border-blue-900/50 text-white placeholder:text-slate-500"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-blue-200">Expiration Format</Label>
                  <Input
                    type="text"
                    placeholder="e.g., 1h, 30m, 1d, 1mo, 1y, or 1h 30m"
                    value={expirationInput}
                    onChange={(e) => setExpirationInput(e.target.value)}
                    className="bg-slate-950/50 border-blue-900/50 text-white placeholder:text-slate-500"
                  />
                  <p className="text-xs text-blue-400">
                    Formats: s (second), m (minute), h (hour), d (day), mo (month), y (year)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className={`text-blue-200 ${keyType === "user-limit" ? "font-semibold" : ""}`}>
                    Max Users {keyType === "user-limit" && <span className="text-red-400">*</span>}
                  </Label>
                  <Input
                    type="number"
                    placeholder={
                      keyType === "one-time"
                        ? "Fixed to 1 for one-time keys"
                        : keyType === "user-limit"
                          ? "Enter maximum number of users"
                          : "Leave empty for unlimited users"
                    }
                    value={keyType === "one-time" ? "1" : maxUsersInput}
                    onChange={(e) => setMaxUsersInput(e.target.value)}
                    disabled={keyType !== "user-limit"}
                    className={`bg-slate-950/50 border-blue-900/50 text-white placeholder:text-slate-500 ${
                      keyType !== "user-limit" ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    min="1"
                  />
                  <p className="text-xs text-blue-400">
                    {keyType === "one-time"
                      ? "One-time keys can only be used by 1 user"
                      : keyType === "user-limit"
                        ? "Required: Set the maximum number of users that can activate with this key"
                        : "Optional: Leave empty for unlimited users"}
                  </p>
                </div>

                <Button
                  onClick={handleCreateKey}
                  disabled={generatingKey}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {generatingKey ? "Generating..." : "Generate Key"}
                </Button>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-slate-900/80 border-blue-900/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Activation Keys ({getFilteredKeys().length})
                  </CardTitle>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setKeyFilter("all")}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        keyFilter === "all"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-950/50 text-blue-300 hover:bg-slate-900"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setKeyFilter("active")}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        keyFilter === "active"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-950/50 text-blue-300 hover:bg-slate-900"
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => setKeyFilter("expire")}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        keyFilter === "expire"
                          ? "bg-red-600 text-white"
                          : "bg-slate-950/50 text-blue-300 hover:bg-slate-900"
                      }`}
                    >
                      Expire
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {getFilteredKeys().length === 0 ? (
                    <div className="text-center py-8 text-blue-300">
                      {keyFilter === "all" ? "No activation keys created yet" : `No ${keyFilter} keys found`}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getFilteredKeys().map((key) => {
                        const timeInfo = key.expiresAt ? calculateTimeRemaining(key.expiresAt) : null
                        return (
                          <div
                            key={key.id}
                            className={`bg-slate-950/50 border rounded-lg p-4 ${
                              timeInfo?.isExpired ? "border-red-900/50" : "border-blue-900/50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <code className="text-white font-mono bg-blue-950/50 px-3 py-1 rounded text-sm">
                                    {key.key}
                                  </code>
                                  <Badge
                                    className={`text-xs font-medium px-2 py-1 rounded ${
                                      key.type === "one-time"
                                        ? "bg-yellow-900/50 text-yellow-200"
                                        : key.type === "unlimited"
                                          ? "bg-green-900/50 text-green-200"
                                          : "bg-red-900/50 text-red-200"
                                    }`}
                                  >
                                    {key.type === "one-time"
                                      ? "One-Time"
                                      : key.type === "unlimited"
                                        ? "Unlimited"
                                        : "User Limit"}
                                  </Badge>
                                </div>
                                <div className="text-sm text-blue-300">
                                  {timeInfo?.remaining && <p>Expires in: {timeInfo.remaining}</p>}
                                  {timeInfo?.isExpired && <p className="text-red-400">Expired</p>}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleDeleteKey(key.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                  title="Delete Key"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === "search" && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-blue-200">Search Query</Label>
                <Input
                  type="text"
                  placeholder="Enter username, key, or telegram"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950/50 border-blue-900/50 text-white placeholder:text-slate-500"
                />
              </div>
              <div>
                <Label className="text-blue-200">Search Type</Label>
                <Select value={searchType} onValueChange={(v) => setSearchType(v as "telegram" | "key")}>
                  <SelectTrigger className="bg-slate-950/50 border-blue-900/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-blue-900/50">
                    <SelectItem value="telegram" className="text-white">
                      Telegram
                    </SelectItem>
                    <SelectItem value="key" className="text-white">
                      Key
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((user) => (
                  <Card key={user.id} className="bg-slate-900/80 border-blue-900/50 backdrop-blur">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-white font-semibold">{user.name}</h3>
                            {user.isBanned && <Badge className="bg-red-600 text-white">Banned</Badge>}
                          </div>
                          <div className="text-sm text-blue-300 space-y-1">
                            <p>Telegram: @{user.telegram}</p>
                            <p>Key: {user.activationKey}</p>
                            <p>Activated: {new Date(user.activatedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {user.isBanned ? (
                            <Button
                              size="sm"
                              onClick={() => handleUnbanUser(user.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              title="Unban"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleBanUser(user.id)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                              title="Ban"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
