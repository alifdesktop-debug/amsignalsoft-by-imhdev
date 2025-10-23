import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith("/am-signal-software/")) {
    const uniqueCode = pathname.split("/")[2]

    // Check if user has activation stored
    const storedUniqueCode = request.cookies.get("am_unique_code")?.value

    // If no stored code or it doesn't match the URL, redirect to home
    if (!storedUniqueCode || storedUniqueCode !== uniqueCode) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    // Check device fingerprint
    const storedDeviceId = request.cookies.get("am_device_id")?.value
    const currentDeviceId = request.headers.get("user-agent") || ""

    // If device doesn't match, redirect to unauthorized device page
    if (storedDeviceId && storedDeviceId !== currentDeviceId) {
      return NextResponse.redirect(new URL("/unauthorized-device", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/am-signal-software/:path*"],
}
