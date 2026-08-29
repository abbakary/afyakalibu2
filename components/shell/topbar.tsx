"use client"

import {
  Bell,
  Building2,
  Check,
  ChevronDown,
  LogOut,
  Search,
  Settings,
  AlertCircle,
  Clock,
  FileText,
  ArrowRight,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useData } from "@/lib/data-store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useMemo } from "react"

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

const roleLabel: Record<string, string> = {
  platform_admin: "Platform Admin",
  org_admin: "Org Admin",
  specialist: "Specialist",
  clinician: "Clinician",
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

type NotificationItem = {
  id: string
  type: "case" | "referral" | "followup"
  label: string
  description: string
  time: string
  href: string
  urgent: boolean
}

export function Topbar() {
  const {
    currentUser,
    activeTenant,
    tenants,
    setActiveTenant,
    isPlatformAdmin,
    cases,
    referrals,
    followUps,
    logout,
  } = useData()
  const router = useRouter()

  // ── Build notification items from live backend data ──────────────────────
  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = []

    // New / urgent cases
    cases
      .filter((c) => c.status === "new" || c.priority === "urgent" || c.priority === "emergency")
      .slice(0, 5)
      .forEach((c) => {
        items.push({
          id: `case-${c.id}`,
          type: "case",
          label:
            c.priority === "emergency"
              ? "Emergency case"
              : c.priority === "urgent"
                ? "Urgent case"
                : "New case",
          description: c.ref + " · " + c.primaryConcern,
          time: timeAgo(c.updatedAt),
          href: `/cases/${c.id}`,
          urgent: c.priority !== "routine",
        })
      })

    // Pending referrals
    referrals
      .filter((r) => r.status === "pending")
      .slice(0, 4)
      .forEach((r) => {
        items.push({
          id: `ref-${r.id}`,
          type: "referral",
          label: "Pending referral",
          description: r.ref + " · " + r.patientName,
          time: timeAgo(r.createdAt),
          href: `/referrals`,
          urgent: r.priority !== "routine",
        })
      })

    // Overdue or due follow-ups
    followUps
      .filter((f) => f.status === "overdue" || f.status === "due")
      .slice(0, 4)
      .forEach((f) => {
        items.push({
          id: `fu-${f.id}`,
          type: "followup",
          label: f.status === "overdue" ? "Overdue follow-up" : "Follow-up due",
          description: f.caseRef + " · " + f.patientName,
          time: timeAgo(f.scheduledFor),
          href: `/follow-up`,
          urgent: f.status === "overdue",
        })
      })

    // Sort urgent first, then by recency (most recent text is shortest — approximate)
    return items.sort((a, b) => Number(b.urgent) - Number(a.urgent)).slice(0, 10)
  }, [cases, referrals, followUps])

  const notifCount = notifications.length

  const notifIcon = (type: NotificationItem["type"]) => {
    if (type === "case") return <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
    if (type === "referral") return <FileText className="h-4 w-4 shrink-0 text-primary" />
    return <Clock className="h-4 w-4 shrink-0 text-amber-500" />
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
      {/* ── Left: tenant switcher ──────────────────────────────────────────── */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "h-9 gap-2 bg-transparent cursor-pointer",
          )}
        >
          <Building2 className="h-4 w-4 text-primary" />
          <span className="max-w-[180px] truncate text-sm font-medium">
            {activeTenant ? activeTenant.name : "All organizations"}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              Organization workspace
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {isPlatformAdmin && (
            <DropdownMenuItem onClick={() => setActiveTenant(null)}>
              <span className="flex-1">All organizations</span>
              {activeTenant === null && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          )}
          {tenants
            .filter((t) => isPlatformAdmin || t.id === currentUser.tenantId)
            .map((t) => (
              <DropdownMenuItem key={t.id} onClick={() => setActiveTenant(t.id)}>
                <div className="flex-1">
                  <p className="text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.region} · {t.plan}
                  </p>
                </div>
                {activeTenant?.id === t.id && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Centre: search ────────────────────────────────────────────────── */}
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search cases, patients, referrals…" className="h-9 pl-9" />
      </div>

      {/* spacer — pushes right-side items to the far right */}
      <div className="flex-1" />

      {/* ── Right: notifications + user menu ─────────────────────────────── */}
      <div className="flex items-center gap-1">
        {/* Notifications dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "relative h-9 w-9 cursor-pointer",
            )}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notifCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {notifCount}
              </span>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-96">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center justify-between">
                <span className="text-sm font-semibold">Notifications</span>
                {notifCount > 0 && (
                  <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                    {notifCount} new
                  </span>
                )}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">All caught up</p>
                <p className="text-xs text-muted-foreground">No new notifications right now.</p>
              </div>
            ) : (
              <>
                {notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    onClick={() => router.push(n.href)}
                    className="flex items-start gap-3 px-3 py-2.5"
                  >
                    <div className="mt-0.5">{notifIcon(n.type)}</div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-xs font-semibold leading-tight",
                          n.urgent ? "text-destructive" : "text-foreground",
                        )}
                      >
                        {n.label}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {n.description}
                      </p>
                    </div>
                    <span className="mt-0.5 shrink-0 text-[10px] text-muted-foreground">
                      {n.time}
                    </span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/cases")}
                  className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-primary"
                >
                  View all cases <ArrowRight className="h-3.5 w-3.5" />
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
            <Avatar className="h-8 w-8">
              <AvatarFallback
                style={{ backgroundColor: currentUser.avatarColor }}
                className="text-xs font-semibold text-white"
              >
                {initials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-tight">{currentUser.name}</p>
              <p className="text-xs leading-tight text-muted-foreground">
                {roleLabel[currentUser.role]}
              </p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <p className="text-sm font-semibold">{currentUser.name}</p>
                <p className="text-xs font-normal text-muted-foreground">{currentUser.email}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
