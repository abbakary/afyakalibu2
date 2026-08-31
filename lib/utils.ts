import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { getApiBase } from '@/lib/api-client'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatImageUrl(url?: string | null): string {
  if (!url) return "/placeholder.svg"
  if (url.startsWith("blob:") || url.startsWith("data:")) return url

  const apiBase = getApiBase()

  // Relative uploads path — prepend the same API origin used for REST calls
  if (url.startsWith("/uploads/") || url.startsWith("uploads/")) {
    const path = url.startsWith("/") ? url : `/${url}`
    return `${apiBase}${path}`
  }

  // Absolute URL whose path is /uploads/... (may still be localhost from an
  // older mobile client). Rewrite onto the configured API host.
  try {
    const parsed = new URL(url)
    if (parsed.pathname.startsWith("/uploads/")) {
      return `${apiBase}${parsed.pathname}`
    }
  } catch {
    // not a valid absolute URL — fall through
  }

  return url
}
