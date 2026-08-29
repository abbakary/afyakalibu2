"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Shared chart color ramp mapped to the design tokens.
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function ChartCard({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-base font-semibold">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="flex-1">{children}</div>
    </Card>
  )
}

// Tooltip that inherits the app surface styling.
export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean
  payload?: { name: string; value: number; color?: string; payload?: Record<string, unknown> }[]
  label?: string
  valueFormatter?: (v: number) => string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-medium text-popover-foreground">{label}</p>}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
            <span className="ml-auto font-medium text-popover-foreground">
              {valueFormatter ? valueFormatter(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
