export function parseExpirationString(expirationStr: string): Date | null {
  if (!expirationStr || !expirationStr.trim()) {
    return null
  }

  const now = new Date()
  let totalMs = 0

  // Parse the expiration string
  const regex = /(\d+)\s*(s|m|h|d|mo|y)/gi
  let match
  let hasMatch = false

  while ((match = regex.exec(expirationStr)) !== null) {
    hasMatch = true
    const value = Number.parseInt(match[1], 10)
    const unit = match[2].toLowerCase()

    switch (unit) {
      case "s":
        totalMs += value * 1000
        break
      case "m":
        totalMs += value * 60 * 1000
        break
      case "h":
        totalMs += value * 60 * 60 * 1000
        break
      case "d":
        totalMs += value * 24 * 60 * 60 * 1000
        break
      case "mo":
        totalMs += value * 30 * 24 * 60 * 60 * 1000
        break
      case "y":
        totalMs += value * 365 * 24 * 60 * 60 * 1000
        break
    }
  }

  if (!hasMatch) {
    throw new Error("Invalid expiration format. Use: 1s, 1m, 1h, 1d, 1mo, 1y (e.g., '1h 30m', '2d 3h')")
  }

  return new Date(now.getTime() + totalMs)
}

export function formatExpirationDisplay(expirationStr: string): string {
  if (!expirationStr || !expirationStr.trim()) {
    return "No expiration"
  }

  try {
    const expirationDate = parseExpirationString(expirationStr)
    if (!expirationDate) return "No expiration"
    return expirationDate.toLocaleDateString()
  } catch {
    return "Invalid format"
  }
}
