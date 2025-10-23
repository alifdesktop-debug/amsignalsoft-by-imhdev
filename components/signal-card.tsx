import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Clock, Zap } from "lucide-react"
import type { Signal } from "@/lib/signal-generator"

interface SignalCardProps {
  signal: Signal
}

export function SignalCard({ signal }: SignalCardProps) {
  const isBuy = signal.direction === "BUY"
  const entryTime = new Date(signal.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    <Card className={`bg-slate-900/80 border-2 backdrop-blur ${isBuy ? "border-emerald-600/50" : "border-red-600/50"}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isBuy ? "bg-emerald-600/20" : "bg-red-600/20"
              }`}
            >
              {isBuy ? (
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-400" />
              )}
            </div>
            <div>
              <CardTitle className="text-white text-xl">{signal.pair}</CardTitle>
              <p className="text-sm text-blue-300">Signal ID: {signal.id}</p>
            </div>
          </div>
          <Badge className={`text-lg px-4 py-1 ${isBuy ? "bg-emerald-600" : "bg-red-600"}`}>{signal.direction}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-300 text-sm">
              <Clock className="w-4 h-4" />
              <span>Entry Time</span>
            </div>
            <p className="text-white font-mono text-sm font-semibold">{entryTime}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-purple-300 text-sm">
              <Zap className="w-4 h-4" />
              <span>Duration</span>
            </div>
            <p className="text-white font-mono text-sm font-semibold">{signal.duration} min</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-300 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>MTG Must</span>
            </div>
            <p className="text-white font-mono text-lg font-semibold">1X Amount</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-300 text-sm">
              <Clock className="w-4 h-4" />
              <span>Confidence</span>
            </div>
            <p className="text-white font-mono text-lg font-semibold">{signal.confidence}%</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-blue-900/50">
          <p className="text-xs text-blue-400">Generated at {new Date(signal.timestamp).toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  )
}
