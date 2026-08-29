"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, PlusCircle, Building2, MoreHorizontal, Power, PowerOff, ArrowRight, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useData } from "@/lib/data-store"
import { PageHeader } from "@/components/shell/page-header"
import { Card } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TenantStatusBadge } from "@/components/status-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { TenantStatus } from "@/lib/types"

const PLAN_LABEL: Record<string, string> = { pilot: "Pilot", growth: "Growth", enterprise: "Enterprise" }
const FILTERS: { key: TenantStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "trial", label: "Trial" },
  { key: "suspended", label: "Suspended" },
]

export default function OrganizationsPage() {
  const { db, updateTenant, refresh } = useData()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<TenantStatus | "all">("all")
  const [refreshing, setRefreshing] = useState(false)

  // Refresh live tenant list on mount so newly-provisioned orgs appear
  useEffect(() => {
    refresh().catch(() => null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refresh()
      toast.success("Organizations refreshed")
    } catch {
      toast.error("Refresh failed")
    } finally {
      setRefreshing(false)
    }
  }, [refresh])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return db.tenants
      .filter((t) => (filter === "all" ? true : t.status === filter))
      .filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.region.toLowerCase().includes(q) ||
          t.contactEmail.toLowerCase().includes(q),
      )
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [db.tenants, query, filter])

  function toggleSuspend(id: string, status: TenantStatus, name: string) {
    const next: TenantStatus = status === "suspended" ? "active" : "suspended"
    updateTenant(id, { status: next })
    toast.success(next === "suspended" ? `${name} suspended` : `${name} reactivated`)
  }

  const count = (s: TenantStatus) => db.tenants.filter((t) => t.status === s).length

  return (
    <div>
      <PageHeader
        title="Organizations"
        description="Provision and manage every clinic and hospital account"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <Link href="/provider/organizations/new" className={cn(buttonVariants({ variant: "default" }))}>
              <PlusCircle className="h-4 w-4" /> Create account
            </Link>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search organizations…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              {f.key !== "all" && ` · ${count(f.key as TenantStatus)}`}
            </button>
          ))}
        </div>
      </div>

      <Card className="mt-4 overflow-hidden">
        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No organizations match your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {list.map((t) => {
              const seatPct = Math.round((t.usedSeats / t.seats) * 100)
              return (
                <div key={t.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                  <Link href={`/provider/organizations/${t.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: t.primaryColor }}
                    >
                      {t.region.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.region}, {t.country} · Created {formatDate(t.createdAt)}
                      </p>
                    </div>
                  </Link>

                  <div className="grid grid-cols-3 items-center gap-4 sm:flex sm:gap-6">
                    <div className="text-xs">
                      <p className="text-muted-foreground">Plan</p>
                      <p className="font-medium">{PLAN_LABEL[t.plan]}</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-muted-foreground">Seats</p>
                      <p className="font-medium">
                        {t.usedSeats}/{t.seats} <span className="text-muted-foreground">({seatPct}%)</span>
                      </p>
                    </div>
                    <div className="flex items-center justify-end sm:w-28">
                      <TenantStatusBadge status={t.status} />
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => router.push(`/provider/organizations/${t.id}`)}>
                        <ArrowRight className="mr-2 h-4 w-4" /> Open details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => toggleSuspend(t.id, t.status, t.name)}
                        className={t.status === "suspended" ? "text-success" : "text-destructive focus:text-destructive"}
                      >
                        {t.status === "suspended" ? (
                          <>
                            <Power className="mr-2 h-4 w-4" /> Reactivate
                          </>
                        ) : (
                          <>
                            <PowerOff className="mr-2 h-4 w-4" /> Suspend
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
