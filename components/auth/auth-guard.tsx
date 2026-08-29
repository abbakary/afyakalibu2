"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useData } from "@/lib/data-store"
import { SkinLinkMark } from "@/components/brand/logo"

// Client-side route guard for authenticated areas.
// - Waits for the persisted session to hydrate before deciding.
// - Redirects unauthenticated visitors to /login (preserving where they were).
// - Optionally restricts a subtree to platform operators (requirePlatformAdmin).
// - By default (tenant workspace), redirects platform admins to /provider so
//   they never land in a tenant clinical workspace by mistake.
export function AuthGuard({
  children,
  requirePlatformAdmin = false,
  allowPlatformAdmin = false,
}: {
  children: React.ReactNode
  requirePlatformAdmin?: boolean
  /** Set true to allow platform admins into an otherwise tenant-only area. */
  allowPlatformAdmin?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { authReady, isAuthenticated, isPlatformAdmin } = useData()

  useEffect(() => {
    if (!authReady) return
    if (!isAuthenticated) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : ""
      router.replace(`/login${next}`)
      return
    }
    // Provider-only area: non-platform-admins go to the tenant workspace.
    if (requirePlatformAdmin && !isPlatformAdmin) {
      router.replace("/dashboard")
      return
    }
    // Tenant workspace: platform admins belong in /provider, not /dashboard.
    if (!requirePlatformAdmin && !allowPlatformAdmin && isPlatformAdmin) {
      router.replace("/provider")
    }
  }, [authReady, isAuthenticated, isPlatformAdmin, requirePlatformAdmin, allowPlatformAdmin, pathname, router])

  const blocked =
    !authReady ||
    !isAuthenticated ||
    (requirePlatformAdmin && !isPlatformAdmin) ||
    (!requirePlatformAdmin && !allowPlatformAdmin && isPlatformAdmin)

  if (blocked) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <SkinLinkMark className="h-10 w-10 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading your workspace…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
