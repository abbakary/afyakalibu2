"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Send,
  Images,
  Sparkles,
  Pill,
  CalendarClock,
  BarChart3,
  BookOpen,
  ShieldCheck,
  Code2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SkinLinkLogo } from "@/components/brand/logo"
import { useData } from "@/lib/data-store"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badgeKey?: "queue" | "followups"
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Clinical",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Case queue", href: "/cases", icon: ClipboardList, badgeKey: "queue" },
      { label: "Patients", href: "/patients", icon: Users },
      { label: "Referrals", href: "/referrals", icon: Send },
      { label: "Image review", href: "/image-review", icon: Images },
    ],
  },
  {
    section: "Care",
    items: [
      { label: "AI assistant", href: "/ai-assistant", icon: Sparkles },
      { label: "Treatment plans", href: "/treatment-plans", icon: Pill },
      { label: "Follow-up", href: "/follow-up", icon: CalendarClock, badgeKey: "followups" },
    ],
  },
  {
    section: "Insights",
    items: [
      { label: "Reports", href: "/reports", icon: BarChart3 },
      { label: "Resources", href: "/resources", icon: BookOpen },
    ],
  },
  {
    section: "Manage",
    items: [
      { label: "Administration", href: "/administration", icon: ShieldCheck },
      { label: "API Access",     href: "/api-access",    icon: Code2 },
    ],
  },
]

export function SidebarNav() {
  const pathname = usePathname()
  const { cases, followUps, isPlatformAdmin, currentUser } = useData()

  const isSpecialist = currentUser.role === "specialist"
  const isOrgAdmin = currentUser.role === "org_admin"

  const queueCount = cases.filter((c) => c.status === "new" || c.status === "in_review").length
  const myQueueCount = cases.filter((c) => c.specialistId === currentUser.id && (c.status === "new" || c.status === "in_review")).length
  const followUpCount = followUps.filter((f) => f.status === "due" || f.status === "overdue").length

  const badgeFor = (key?: NavItem["badgeKey"]) => {
    if (key === "queue") return isSpecialist ? (myQueueCount > 0 ? myQueueCount : null) : (queueCount > 0 ? queueCount : null)
    if (key === "followups" && followUpCount > 0) return followUpCount
    return null
  }

  // Build role-specific nav
  const nav: typeof NAV = isSpecialist ? [
    {
      section: "My work",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "My cases", href: "/cases", icon: ClipboardList, badgeKey: "queue" },
        { label: "Image review", href: "/image-review", icon: Images },
      ],
    },
    {
      section: "Care",
      items: [
        { label: "AI assistant", href: "/ai-assistant", icon: Sparkles },
        { label: "Treatment plans", href: "/treatment-plans", icon: Pill },
        { label: "Follow-up", href: "/follow-up", icon: CalendarClock, badgeKey: "followups" },
      ],
    },
    {
      section: "Insights",
      items: [
        { label: "Reports", href: "/reports", icon: BarChart3 },
        { label: "Resources", href: "/resources", icon: BookOpen },
      ],
    },
  ] : NAV

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Link href="/dashboard">
          <SkinLinkLogo variant="light" />
        </Link>
      </div>

      {/* Role badge */}
      <div className="px-5 py-3">
        <span className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
          isSpecialist ? "bg-teal-500/20 text-teal-300"
          : isOrgAdmin ? "bg-violet-500/20 text-violet-300"
          : "bg-sidebar-primary/20 text-sidebar-primary",
        )}>
          {isSpecialist ? "Dermatologist" : isOrgAdmin ? "Org Admin" : "Clinician"}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {nav.map((group) => (
          <div key={group.section} className="mb-5">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/")
                const Icon = item.icon
                const badge = badgeFor(item.badgeKey)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {badge != null && (
                        <span className={cn(
                          "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                          active ? "bg-white/25 text-white" : "bg-sidebar-accent text-sidebar-accent-foreground",
                        )}>
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/50 p-3 text-xs">
          <ShieldCheck className="h-4 w-4 text-sidebar-primary" />
          <span className="text-sidebar-foreground/70 leading-tight">
            Secure, tenant-isolated tele-dermatology
          </span>
        </div>
      </div>
    </aside>
  )
}
