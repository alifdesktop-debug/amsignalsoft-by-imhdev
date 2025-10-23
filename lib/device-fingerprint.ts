export function generateDeviceFingerprint(): string {
  if (typeof window === "undefined") return ""

  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as any).deviceMemory,
    maxTouchPoints: navigator.maxTouchPoints,
    vendor: navigator.vendor,
  }

  return JSON.stringify(fingerprint)
}

export function getStoredDeviceFingerprint(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("am_device_fingerprint")
}

export function storeDeviceFingerprint(): string {
  const fingerprint = generateDeviceFingerprint()
  localStorage.setItem("am_device_fingerprint", fingerprint)
  return fingerprint
}

export function verifyDeviceFingerprint(): boolean {
  const current = generateDeviceFingerprint()
  const stored = getStoredDeviceFingerprint()
  return current === stored
}
