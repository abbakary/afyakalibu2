import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  tone = "default",
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: number
  trendLabel?: string
  tone?: "default" | "primary" | "success" | "warning" | "destructive"
}) {
  const toneCls: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/12 text-destructive",
  }
  return (
    <Card className="flex items-start justify-between gap-3 p-5">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-heading text-3xl font-bold tracking-tight">{value}</p>
        {trend != null && (
          <p
            className={cn(
              "mt-1.5 flex items-center gap-1 text-xs font-medium",
              trend >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {trend >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(trend)}% {trendLabel}
          </p>
        )}
      </div>
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", toneCls[tone])}>
        <Icon className="h-5 w-5" />
      </div>
    </Card>
  )
}
