"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ClipboardList, Users, Sparkles, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Cases", href: "/cases", icon: ClipboardList },
  { label: "Patients", href: "/patients", icon: Users },
  { label: "AI", href: "/ai-assistant", icon: Sparkles },
  { label: "Admin", href: "/administration", icon: ShieldCheck },
]

export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-card px-2 py-1.5 lg:hidden">
      {ITEMS.map((item) => {
        const active = pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[11px] font-medium",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
