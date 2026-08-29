import type React from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { ProviderShell } from "@/components/provider/provider-shell"
import { Toaster } from "@/components/ui/sonner"

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requirePlatformAdmin>
      <ProviderShell>{children}</ProviderShell>
      <Toaster position="top-right" />
    </AuthGuard>
  )
}
