import { database, ref, set, get, push, remove } from "./firebase"
import type { User, ActivationKey, SignalHistory, UserSession } from "./storage"

// Users operations
export async function getUsers(): Promise<User[]> {
  try {
    const snapshot = await get(ref(database, "users"))
    if (snapshot.exists()) {
      const data = snapshot.val()
      return Object.values(data) as User[]
    }
    return []
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

export async function saveUser(user: User): Promise<void> {
  try {
    await set(ref(database, `users/${user.id}`), user)
  } catch (error) {
    console.error("Error saving user:", error)
  }
}

export async function getUserByTelegram(telegram: string): Promise<User | undefined> {
  try {
    const snapshot = await get(ref(database, "users"))
    if (snapshot.exists()) {
      const data = snapshot.val()
      const user = Object.values(data).find((u: any) => u.telegram === telegram) as User | undefined
      return user
    }
    return undefined
  } catch (error) {
    console.error("Error fetching user by telegram:", error)
    return undefined
  }
}

export async function getUserByUniqueCode(uniqueCode: string): Promise<User | undefined> {
  try {
    const snapshot = await get(ref(database, "users"))
    if (snapshot.exists()) {
      const data = snapshot.val()
      const user = Object.values(data).find((u: any) => u.uniqueCode === uniqueCode) as User | undefined
      return user
    }
    return undefined
  } catch (error) {
    console.error("Error fetching user by unique code:", error)
    return undefined
  }
}

// Activation Keys operations
export async function getActivationKeys(): Promise<ActivationKey[]> {
  try {
    const snapshot = await get(ref(database, "activationKeys"))
    if (snapshot.exists()) {
      const data = snapshot.val()
      return Object.values(data) as ActivationKey[]
    }
    return []
  } catch (error) {
    console.error("Error fetching activation keys:", error)
    return []
  }
}

export async function saveActivationKey(key: ActivationKey): Promise<void> {
  try {
    await set(ref(database, `activationKeys/${key.id}`), key)
  } catch (error) {
    console.error("Error saving activation key:", error)
  }
}

// Signal History operations
export async function getSignalHistory(userId: string): Promise<SignalHistory[]> {
  try {
    const snapshot = await get(ref(database, `signalHistory/${userId}`))
    if (snapshot.exists()) {
      const data = snapshot.val()
      return Object.values(data) as SignalHistory[]
    }
    return []
  } catch (error) {
    console.error("Error fetching signal history:", error)
    return []
  }
}

export async function saveSignalToHistory(
  userId: string,
  pair: string,
  type: "live" | "future",
  signals: any[],
): Promise<void> {
  try {
    const historyRef = ref(database, `signalHistory/${userId}`)
    const newSignalRef = push(historyRef)
    const historyEntry: SignalHistory = {
      id: newSignalRef.key || "",
      pair,
      type,
      signals,
      generatedAt: new Date().toISOString(),
    }
    await set(newSignalRef, historyEntry)
  } catch (error) {
    console.error("Error saving signal to history:", error)
  }
}

export async function clearSignalHistory(userId: string): Promise<void> {
  try {
    await remove(ref(database, `signalHistory/${userId}`))
  } catch (error) {
    console.error("Error clearing signal history:", error)
  }
}

// User Session operations
export async function saveUserSession(userId: string, session: UserSession): Promise<void> {
  try {
    await set(ref(database, `sessions/${userId}`), session)
  } catch (error) {
    console.error("Error saving user session:", error)
  }
}

export async function getUserSession(userId: string): Promise<UserSession | null> {
  try {
    const snapshot = await get(ref(database, `sessions/${userId}`))
    if (snapshot.exists()) {
      return snapshot.val() as UserSession
    }
    return null
  } catch (error) {
    console.error("Error fetching user session:", error)
    return null
  }
}
