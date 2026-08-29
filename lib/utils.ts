import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatImageUrl(url?: string | null): string {
  if (!url) return "/placeholder.svg"
  if (url.startsWith("blob:") || url.startsWith("data:")) return url

  const apiBase =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
    "http://localhost:8000"

  // Already a relative uploads path — prepend API base
  if (url.startsWith("/uploads/")) {
    return `${apiBase}${url}`
  }

  // Absolute URL pointing at an uploads path on any host/IP
  // (mobile app may use 10.0.2.2, 127.0.0.1, a LAN IP, or any port)
  try {
    const parsed = new URL(url)
    if (parsed.pathname.startsWith("/uploads/")) {
      // Rewrite the host/port to the configured API base so the browser
      // can always reach it, regardless of what IP the mobile app used.
      const base = new URL(apiBase)
      parsed.protocol = base.protocol
      parsed.hostname = base.hostname
      parsed.port = base.port
      return parsed.toString()
    }
  } catch {
    // not a valid absolute URL — fall through
  }

  return url
}
