import type React from "react"
import { SidebarNav } from "@/components/shell/sidebar-nav"
import { Topbar } from "@/components/shell/topbar"
import { MobileNav } from "@/components/shell/mobile-nav"
import { Toaster } from "@/components/ui/sonner"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        <SidebarNav />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto px-4 pb-24 pt-6 lg:px-8 lg:pb-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
        <MobileNav />
        <Toaster position="top-right" />
      </div>
    </AuthGuard>
  )
}
