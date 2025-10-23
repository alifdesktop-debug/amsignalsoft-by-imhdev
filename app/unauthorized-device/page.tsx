"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Home } from "lucide-react"

export default function UnauthorizedDevicePage() {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("am_unique_code")
    localStorage.removeItem("am_device_fingerprint")
    document.cookie = "am_unique_code=; path=/; max-age=0"

    // Redirect to home
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4">
      <Card className="bg-slate-900/80 border-red-900/50 backdrop-blur max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-white text-2xl">Unauthorized Device</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-red-300">
              This signal page can only be accessed from the device where it was activated.
            </p>
            <p className="text-slate-400 text-sm">
              For security reasons, each account is locked to a single device to prevent unauthorized access.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={handleLogout} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <Home className="w-4 h-4 mr-2" />
              Return to Login
            </Button>
          </div>

          <p className="text-xs text-slate-500 text-center">If you believe this is an error, please contact support.</p>
        </CardContent>
      </Card>
    </div>
  )
}
