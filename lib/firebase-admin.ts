import { database, ref, set, get, remove, update, onValue } from "@/lib/firebase"

export interface ActivationKey {
  id: string
  key: string
  type: "one-time" | "unlimited" | "user-limit"
  expiresAt: string | null
  usedBy: string[]
  createdAt: string
  maxUsers: number | null
  isExpired: boolean
}

export interface User {
  id: string
  name: string
  telegram: string
  activationKey: string
  activatedAt: string
  isBanned: boolean
  uniqueCode: string
}

export interface SignalEntry {
  id: string
  userId: string
  pair: string
  type: "live" | "future"
  signals: Signal[]
  generatedAt: string
}

export interface Signal {
  id: string
  pair: string
  type: "live" | "future"
  direction: "buy" | "sell"
  price: number
  timestamp: string
  accuracy: number
  confidence: number
  status: "active" | "expired" | "invalid"
}

export function generateActivationKey(): string {
  return "AM-" + Math.random().toString(36).substring(2, 15).toUpperCase()
}

// Activation Keys Functions
export async function getActivationKeys(): Promise<ActivationKey[]> {
  try {
    console.log("[v0] Fetching activation keys from Firebase...")
    const snapshot = await get(ref(database, "activationKeys"))
    if (!snapshot.exists()) {
      console.log("[v0] No activation keys found")
      return []
    }
    const data = snapshot.val()
    console.log("[v0] Activation keys fetched:", data)
    return Object.values(data) as ActivationKey[]
  } catch (error) {
    console.error("[v0] Error fetching activation keys:", error)
    return []
  }
}

export async function saveActivationKey(key: ActivationKey): Promise<void> {
  try {
    console.log("[v0] Saving activation key:", key)
    await set(ref(database, `activationKeys/${key.id}`), key)
    console.log("[v0] Activation key saved successfully")
  } catch (error) {
    console.error("[v0] Error saving activation key:", error)
    throw error
  }
}

export async function deleteActivationKey(id: string): Promise<void> {
  try {
    console.log("[v0] Deleting activation key:", id)
    await remove(ref(database, `activationKeys/${id}`))
    console.log("[v0] Activation key deleted successfully")
  } catch (error) {
    console.error("[v0] Error deleting activation key:", error)
    throw error
  }
}

export async function updateActivationKey(id: string, updates: Partial<ActivationKey>): Promise<void> {
  try {
    console.log("[v0] Updating activation key:", id, updates)
    await update(ref(database, `activationKeys/${id}`), updates)
    console.log("[v0] Activation key updated successfully")
  } catch (error) {
    console.error("[v0] Error updating activation key:", error)
    throw error
  }
}

export async function validateActivationCode(code: string): Promise<ActivationKey | null> {
  try {
    console.log("[v0] Validating activation code:", code)
    const keys = await getActivationKeys()
    console.log("[v0] Available keys:", keys)

    const normalizedCode = code.trim().toUpperCase()
    const key = keys.find((k) => {
      const normalizedKey = k.key.trim().toUpperCase()
      console.log("[v0] Comparing:", normalizedCode, "with", normalizedKey)
      return normalizedKey === normalizedCode
    })

    if (!key) {
      console.log("[v0] Activation code not found:", code)
      return null
    }

    // Check if key is marked as expired (used up)
    if (key.isExpired) {
      console.log("[v0] Activation code is expired (used up):", code)
      return null
    }

    // Check if key is expired by date
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      console.log("[v0] Activation code expired:", code)
      return null
    }

    // Check if key is one-time and already used
    if (key.type === "one-time" && key.usedBy && key.usedBy.length > 0) {
      console.log("[v0] One-time activation code already used:", code)
      return null
    }

    // Check if max users limit has been reached
    if (key.maxUsers && key.usedBy && key.usedBy.length >= key.maxUsers) {
      console.log("[v0] Activation code max users limit reached:", code)
      return null
    }

    console.log("[v0] Activation code is valid:", code)
    return key
  } catch (error) {
    console.error("[v0] Error validating activation code:", error)
    return null
  }
}

export async function markActivationCodeAsUsed(keyId: string, telegram: string): Promise<void> {
  try {
    console.log("[v0] Marking activation code as used:", keyId, telegram)
    const keys = await getActivationKeys()
    const key = keys.find((k) => k.id === keyId)

    if (key) {
      const usedBy = key.usedBy || []
      if (!usedBy.includes(telegram)) {
        usedBy.push(telegram)

        const updates: Partial<ActivationKey> = { usedBy }

        if (key.type === "one-time") {
          updates.isExpired = true
          console.log("[v0] One-time key marked as expired after use")
        }

        if (key.type === "user-limit" && key.maxUsers && usedBy.length >= key.maxUsers) {
          updates.isExpired = true
          console.log("[v0] User-limit key marked as expired - max users reached")
        }

        await updateActivationKey(keyId, updates)
        console.log("[v0] Activation code marked as used")
      }
    }
  } catch (error) {
    console.error("[v0] Error marking activation code as used:", error)
    throw error
  }
}

// Users Functions
export async function getUsers(): Promise<User[]> {
  try {
    console.log("[v0] Fetching users from Firebase...")
    const snapshot = await get(ref(database, "users"))
    if (!snapshot.exists()) {
      console.log("[v0] No users found")
      return []
    }
    const data = snapshot.val()
    console.log("[v0] Users fetched:", data)
    return Object.values(data) as User[]
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    return []
  }
}

export async function saveUser(user: User): Promise<void> {
  try {
    console.log("[v0] Saving user:", user)
    await set(ref(database, `users/${user.id}`), user)
    console.log("[v0] User saved successfully")
  } catch (error) {
    console.error("[v0] Error saving user:", error)
    throw error
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    console.log("[v0] Deleting user:", id)
    await remove(ref(database, `users/${id}`))
    console.log("[v0] User deleted successfully")
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
    throw error
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<void> {
  try {
    console.log("[v0] Updating user:", id, updates)
    await update(ref(database, `users/${id}`), updates)
    console.log("[v0] User updated successfully")
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    throw error
  }
}

export async function banUser(userId: string): Promise<void> {
  try {
    console.log("[v0] Banning user:", userId)
    await update(ref(database, `users/${userId}`), { isBanned: true })
    console.log("[v0] User banned successfully")
  } catch (error) {
    console.error("[v0] Error banning user:", error)
    throw error
  }
}

export async function unbanUser(userId: string): Promise<void> {
  try {
    console.log("[v0] Unbanning user:", userId)
    await update(ref(database, `users/${userId}`), { isBanned: false })
    console.log("[v0] User unbanned successfully")
  } catch (error) {
    console.error("[v0] Error unbanning user:", error)
    throw error
  }
}

export async function getUsersByKey(key: string): Promise<User[]> {
  try {
    const users = await getUsers()
    return users.filter((u) => u.activationKey === key)
  } catch (error) {
    console.error("[v0] Error getting users by key:", error)
    return []
  }
}

export async function getUserByTelegram(telegram: string): Promise<User | null> {
  try {
    const users = await getUsers()
    return users.find((u) => u.telegram === telegram) || null
  } catch (error) {
    console.error("[v0] Error getting user by telegram:", error)
    return null
  }
}

export async function getUserByUniqueCode(uniqueCode: string): Promise<User | null> {
  try {
    console.log("[v0] Getting user by unique code:", uniqueCode)
    const users = await getUsers()
    const user = users.find((u) => u.uniqueCode === uniqueCode) || null
    console.log("[v0] User found:", user)
    return user
  } catch (error) {
    console.error("[v0] Error getting user by unique code:", error)
    return null
  }
}

export async function banAllUsersByKey(key: string): Promise<void> {
  try {
    const users = await getUsersByKey(key)
    for (const user of users) {
      await banUser(user.id)
    }
  } catch (error) {
    console.error("[v0] Error banning all users by key:", error)
    throw error
  }
}

export async function unbanAllUsersByKey(key: string): Promise<void> {
  try {
    const users = await getUsersByKey(key)
    for (const user of users) {
      await unbanUser(user.id)
    }
  } catch (error) {
    console.error("[v0] Error unbanning all users by key:", error)
    throw error
  }
}

export async function deleteAllUsersByKey(key: string): Promise<void> {
  try {
    const users = await getUsersByKey(key)
    for (const user of users) {
      await deleteUser(user.id)
    }
  } catch (error) {
    console.error("[v0] Error deleting all users by key:", error)
    throw error
  }
}

// Real-time listeners
export function onActivationKeysChange(callback: (keys: ActivationKey[]) => void): () => void {
  let hasCalledBack = false

  const unsubscribe = onValue(
    ref(database, "activationKeys"),
    (snapshot) => {
      hasCalledBack = true
      console.log("[v0] Activation keys listener triggered")
      if (!snapshot.exists()) {
        console.log("[v0] No activation keys in database")
        callback([])
        return
      }
      const data = snapshot.val()
      console.log("[v0] Activation keys updated:", data)
      callback(Object.values(data) as ActivationKey[])
    },
    (error) => {
      console.error("[v0] Firebase error loading keys:", error)
      hasCalledBack = true
      callback([])
    },
  )

  const timeoutId = setTimeout(() => {
    if (!hasCalledBack) {
      console.warn("[v0] Firebase keys listener timeout - returning empty array")
      callback([])
    }
  }, 5000)

  return () => {
    clearTimeout(timeoutId)
    unsubscribe()
  }
}

export function onUsersChange(callback: (users: User[]) => void): () => void {
  let hasCalledBack = false

  const unsubscribe = onValue(
    ref(database, "users"),
    (snapshot) => {
      hasCalledBack = true
      console.log("[v0] Users listener triggered")
      if (!snapshot.exists()) {
        console.log("[v0] No users in database")
        callback([])
        return
      }
      const data = snapshot.val()
      console.log("[v0] Users updated:", data)
      callback(Object.values(data) as User[])
    },
    (error) => {
      console.error("[v0] Firebase error loading users:", error)
      hasCalledBack = true
      callback([])
    },
  )

  const timeoutId = setTimeout(() => {
    if (!hasCalledBack) {
      console.warn("[v0] Firebase users listener timeout - returning empty array")
      callback([])
    }
  }, 5000)

  return () => {
    clearTimeout(timeoutId)
    unsubscribe()
  }
}

export async function saveSignalEntry(entry: SignalEntry): Promise<void> {
  try {
    console.log("[v0] Saving signal entry:", entry)
    await set(ref(database, `signals/${entry.userId}/${entry.id}`), entry)
    console.log("[v0] Signal entry saved successfully")
  } catch (error) {
    console.error("[v0] Error saving signal entry:", error)
    throw error
  }
}

export async function getSignalHistory(userId: string): Promise<SignalEntry[]> {
  try {
    console.log("[v0] Fetching signal history for user:", userId)
    const snapshot = await get(ref(database, `signals/${userId}`))
    if (!snapshot.exists()) {
      console.log("[v0] No signal history found for user:", userId)
      return []
    }
    const data = snapshot.val()
    console.log("[v0] Signal history fetched:", data)
    return Object.values(data) as SignalEntry[]
  } catch (error) {
    console.error("[v0] Error fetching signal history:", error)
    return []
  }
}

export function onSignalHistoryChange(userId: string, callback: (signals: SignalEntry[]) => void): () => void {
  let hasCalledBack = false

  const unsubscribe = onValue(
    ref(database, `signals/${userId}`),
    (snapshot) => {
      hasCalledBack = true
      console.log("[v0] Signal history listener triggered for user:", userId)
      if (!snapshot.exists()) {
        console.log("[v0] No signal history in database for user:", userId)
        callback([])
        return
      }
      const data = snapshot.val()
      console.log("[v0] Signal history updated:", data)
      callback(Object.values(data) as SignalEntry[])
    },
    (error) => {
      console.error("[v0] Firebase error loading signal history:", error)
      hasCalledBack = true
      callback([])
    },
  )

  const timeoutId = setTimeout(() => {
    if (!hasCalledBack) {
      console.warn("[v0] Firebase signal history listener timeout - returning empty array")
      callback([])
    }
  }, 5000)

  return () => {
    clearTimeout(timeoutId)
    unsubscribe()
  }
}

export const saveSignalHistory = saveSignalEntry
