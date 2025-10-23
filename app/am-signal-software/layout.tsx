"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    // If accessing /am-signal-software without a unique code, redirect to home
    if (typeof window !== "undefined" && window.location.pathname === "/am-signal-software") {
      router.push("/")
    }
  }, [router])

  return <>{children}</>
}
