"use client"

import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function BanPage() {
  const handleContactAdmin = () => {
    window.open("https://t.me/SojibTraderr", "_blank")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-md">
        {/* Ban Symbol */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center border-2 border-red-600">
            <AlertCircle className="w-16 h-16 text-red-600" />
          </div>
        </div>

        {/* Ban Message */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white">YOU ARE BANNED</h1>
          <p className="text-xl font-semibold text-red-400">FROM AM SIGNAL SOFTWARE</p>
          <p className="text-blue-300 text-sm">CONTRACT ADMIN TO UNBAN REQUEST</p>
        </div>

        {/* Contact Admin Button */}
        <Button
          onClick={handleContactAdmin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-6 text-lg font-semibold"
        >
          CONTRACT ADMIN
        </Button>
      </div>
    </div>
  )
}
