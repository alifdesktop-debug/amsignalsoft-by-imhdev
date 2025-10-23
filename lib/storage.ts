// Local storage utilities for managing activation keys and sessions

export interface ActivationKey {
  id: string
  key: string
  type: "one-time" | "unlimited"
  expiresAt: string | null
  usedBy: string[]
  createdAt: string
}

export interface UserSession {
  name: string
  telegram: string
  activationKey: string
  activatedAt: string
}

export interface SignalHistory {
  id: string
  pair: string
  type: "live" | "future"
  signals: any[] // Declare Signal type or import it
  generatedAt: string
}

type Signal = {}

const KEYS_STORAGE = "am_activation_keys"
const SESSION_STORAGE = "am_user_session"
const SIGNAL_HISTORY_STORAGE = "am_signal_history"
const USERS_STORAGE = "am_users"

export interface User {
  id: string
  name: string
  telegram: string
  activationKey: string
  activatedAt: string
  isBanned: boolean
  uniqueCode: string
}

export function getActivationKeys(): ActivationKey[] {
  if (typeof window === "undefined") return []
  const keys = localStorage.getItem(KEYS_STORAGE)
  return keys ? JSON.parse(keys) : []
}

export function saveActivationKeys(keys: ActivationKey[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEYS_STORAGE, JSON.stringify(keys))
}

export function validateActivationKey(key: string, telegram: string): boolean {
  const keys = getActivationKeys()
  const activationKey = keys.find((k) => k.key === key)

  if (!activationKey) return false

  // Check expiration
  if (activationKey.expiresAt && new Date(activationKey.expiresAt) < new Date()) {
    return false
  }

  // Check if one-time key already used
  if (activationKey.type === "one-time" && activationKey.usedBy.length > 0) {
    return false
  }

  // Check if unlimited key already used by this user
  if (activationKey.type === "unlimited" && activationKey.usedBy.includes(telegram)) {
    return true // Already activated, allow access
  }

  const existingUser = getUserByTelegram(telegram)
  if (!existingUser) {
    addUser("User", telegram, key)
  }

  // Mark as used
  activationKey.usedBy.push(telegram)
  saveActivationKeys(keys)

  return true
}

export function getUserSession(): UserSession | null {
  if (typeof window === "undefined") return null
  const session = localStorage.getItem(SESSION_STORAGE)
  return session ? JSON.parse(session) : null
}

export function saveUserSession(session: UserSession) {
  if (typeof window === "undefined") return
  localStorage.setItem(SESSION_STORAGE, JSON.stringify(session))
}

export function clearUserSession() {
  if (typeof window === "undefined") return
  localStorage.removeItem(SESSION_STORAGE)
}

export function generateActivationKey(): string {
  return "AM-" + Math.random().toString(36).substring(2, 15).toUpperCase()
}

export function getSignalHistory(): SignalHistory[] {
  if (typeof window === "undefined") return []
  const history = localStorage.getItem(SIGNAL_HISTORY_STORAGE)
  return history ? JSON.parse(history) : []
}

export function saveSignalToHistory(pair: string, type: "live" | "future", signals: any[]) {
  if (typeof window === "undefined") return
  const history = getSignalHistory()
  const historyEntry: SignalHistory = {
    id: Math.random().toString(36).substring(2, 15),
    pair,
    type,
    signals,
    generatedAt: new Date().toISOString(),
  }
  history.unshift(historyEntry)
  localStorage.setItem(SIGNAL_HISTORY_STORAGE, JSON.stringify(history))
}

export const saveSignalHistory = saveSignalToHistory

export function clearSignalHistory() {
  if (typeof window === "undefined") return
  localStorage.removeItem(SIGNAL_HISTORY_STORAGE)
}

export function getUsers(): User[] {
  if (typeof window === "undefined") return []
  const users = localStorage.getItem(USERS_STORAGE)
  return users ? JSON.parse(users) : []
}

export function saveUsers(users: User[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(USERS_STORAGE, JSON.stringify(users))
}

export function addUser(name: string, telegram: string, activationKey: string): User {
  const users = getUsers()
  const uniqueCode = generateUniqueCode()
  const newUser: User = {
    id: Math.random().toString(36).substring(7),
    name,
    telegram,
    activationKey,
    activatedAt: new Date().toISOString(),
    isBanned: false,
    uniqueCode,
  }
  users.push(newUser)
  saveUsers(users)
  return newUser
}

export function banUser(userId: string) {
  const users = getUsers()
  const user = users.find((u) => u.id === userId)
  if (user) {
    user.isBanned = true
    saveUsers(users)
  }
}

export function unbanUser(userId: string) {
  const users = getUsers()
  const user = users.find((u) => u.id === userId)
  if (user) {
    user.isBanned = false
    saveUsers(users)
  }
}

export function deleteUser(userId: string) {
  const users = getUsers()
  const updatedUsers = users.filter((u) => u.id !== userId)
  saveUsers(updatedUsers)
}

export function getUsersByKey(key: string): User[] {
  const users = getUsers()
  return users.filter((u) => u.activationKey === key)
}

export function getUserByTelegram(telegram: string): User | undefined {
  const users = getUsers()
  return users.find((u) => u.telegram === telegram)
}

export function banAllUsersByKey(key: string) {
  const users = getUsers()
  users.forEach((u) => {
    if (u.activationKey === key) {
      u.isBanned = true
    }
  })
  saveUsers(users)
}

export function unbanAllUsersByKey(key: string) {
  const users = getUsers()
  users.forEach((u) => {
    if (u.activationKey === key) {
      u.isBanned = false
    }
  })
  saveUsers(users)
}

export function deleteAllUsersByKey(key: string) {
  const users = getUsers()
  const updatedUsers = users.filter((u) => u.activationKey !== key)
  saveUsers(updatedUsers)
}

export function generateUniqueCode(): string {
  return Math.random().toString(36).substring(2, 12).toUpperCase()
}

export function getUserByUniqueCode(uniqueCode: string): User | undefined {
  const users = getUsers()
  return users.find((u) => u.uniqueCode === uniqueCode)
}
