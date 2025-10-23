"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface TerminalAnimationProps {
  type: "live" | "future"
  onComplete?: () => void
}

const analysisSteps = [
  "Initializing market analysis...",
  "Scanning price patterns...",
  "Analyzing support and resistance levels...",
  "Calculating momentum indicators...",
  "Evaluating trend strength...",
  "Processing volume data...",
  "Running prediction algorithms...",
  "Validating signal accuracy...",
  "Generating trading signal...",
  "Signal ready!",
]

export function TerminalAnimation({ type, onComplete }: TerminalAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [lines, setLines] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [isWaiting, setIsWaiting] = useState(type === "future")
  const [waitingSeconds, setWaitingSeconds] = useState(20)
  const [waitProgress, setWaitProgress] = useState(0)

  useEffect(() => {
    if (type !== "future") return

    const waitInterval = setInterval(() => {
      setWaitingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(waitInterval)
          setIsWaiting(false)
          return 0
        }
        return prev - 1
      })
      setWaitProgress((prev) => Math.min(prev + 5, 95))
    }, 1000)

    return () => clearInterval(waitInterval)
  }, [type])

  useEffect(() => {
    if (type === "future" && isWaiting) return

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const nextStep = prev + 1
        if (nextStep <= analysisSteps.length) {
          setLines((prevLines) => [...prevLines, analysisSteps[prev]])
        }
        if (nextStep === analysisSteps.length) {
          setIsComplete(true)
          if (onComplete) {
            onComplete()
          }
        }
        return nextStep
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [type, isWaiting, onComplete])

  const progressPercentage = isWaiting ? waitProgress : Math.round((currentStep / analysisSteps.length) * 100)

  return (
    <Card className="bg-slate-950 border-blue-900/50 backdrop-blur overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <span className="text-blue-400 font-mono text-sm">
            AM Terminal - {type === "live" ? "Live Signal" : "Future Signals"} Analysis
          </span>
        </div>

        <div className="font-mono text-sm space-y-2 min-h-[300px]">
          {isWaiting && (
            <div className="flex items-start gap-2">
              <span className="text-emerald-500">{">"}</span>
              <span className="text-blue-300">Preparing future signal analysis...</span>
            </div>
          )}
          {isWaiting && (
            <div className="flex items-start gap-2">
              <span className="text-emerald-500">{">"}</span>
              <span className="text-yellow-400">Waiting: {waitingSeconds} seconds remaining...</span>
              <span className="inline-block w-2 h-4 bg-yellow-500 animate-pulse ml-1" />
            </div>
          )}

          {!isWaiting &&
            lines.map((line, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-emerald-500">{">"}</span>
                <span className="text-blue-300">{line}</span>
                {index === lines.length - 1 && (
                  <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-1" />
                )}
              </div>
            ))}
          {isComplete && (
            <div className="flex items-start gap-2 mt-4 pt-4 border-t border-emerald-500/30">
              <span className="text-emerald-500">{">"}</span>
              <span className="text-emerald-400 font-semibold">Analysis Complete - 100% Ready</span>
            </div>
          )}
        </div>

        <div className="mt-4 bg-blue-950/30 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-400">Progress</span>
            <span className={`${isComplete ? "text-emerald-400 font-semibold" : "text-blue-300"}`}>
              {progressPercentage}%
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isComplete
                  ? "bg-emerald-600"
                  : isWaiting
                    ? "bg-yellow-600"
                    : "bg-gradient-to-r from-blue-600 to-emerald-600"
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
