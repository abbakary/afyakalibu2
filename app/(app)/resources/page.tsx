"use client"

import { useMemo, useState } from "react"
import {
  BookOpen,
  Search,
  FileText,
  Video,
  ScrollText,
  ClipboardList,
  ExternalLink,
  Filter,
  Plus,
} from "lucide-react"
import { toast } from "sonner"
import { useData } from "@/lib/data-store"
import { PageHeader } from "@/components/shell/page-header"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Resource } from "@/lib/types"

const TYPE_META: Record<
  Resource["type"],
  { icon: React.ComponentType<{ className?: string }>; color: string; label: string }
> = {
  PDF: { icon: FileText, color: "bg-destructive/10 text-destructive", label: "PDF" },
  Video: { icon: Video, color: "bg-primary/10 text-primary", label: "Video" },
  Article: { icon: ScrollText, color: "bg-success/12 text-success", label: "Article" },
  Protocol: { icon: ClipboardList, color: "bg-warning/15 text-warning-foreground", label: "Protocol" },
}

export default function ResourcesPage() {
  const { resources, addResource, currentUser, activeTenant } = useData()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [showAdd, setShowAdd] = useState(false)

  const categories = useMemo(() => {
    const set = new Set(resources.map((r) => r.category))
    return ["all", ...Array.from(set).sort()]
  }, [resources])

  const filtered = useMemo(() => {
    return resources
      .filter((r) => (category === "all" ? true : r.category === category))
      .filter((r) => (typeFilter === "all" ? true : r.type === typeFilter))
      .filter((r) => {
        if (!query) return true
        const hay = `${r.title} ${r.description} ${r.category}`.toLowerCase()
        return hay.includes(query.toLowerCase())
      })
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
  }, [resources, category, typeFilter, query])

  const byType = useMemo(() => {
    const counts: Partial<Record<Resource["type"], number>> = {}
    for (const r of resources) counts[r.type] = (counts[r.type] ?? 0) + 1
    return counts
  }, [resources])

  const canManage = currentUser.role === "org_admin" || currentUser.role === "platform_admin"

  return (
    <div>
      <PageHeader
        title="Resources"
        description="Clinical protocols, patient education, and reference materials for your team"
        actions={
          canManage ? (
            <Button onClick={() => setShowAdd((v) => !v)}>
              <Plus className="h-4 w-4" /> {showAdd ? "Cancel" : "Add resource"}
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total resources" value={resources.length} icon={BookOpen} tone="primary" />
        <StatCard label="Protocols" value={byType.Protocol ?? 0} icon={ClipboardList} />
        <StatCard label="Patient education" value={resources.filter((r) => r.category.includes("Patient")).length} icon={FileText} tone="success" />
        <StatCard label="Videos & articles" value={(byType.Video ?? 0) + (byType.Article ?? 0)} icon={Video} />
      </div>

      {showAdd && canManage && (
        <AddResourceForm
          onCancel={() => setShowAdd(false)}
          onSave={(data) => {
            addResource(data)
            toast.success("Resource added")
            setShowAdd(false)
          }}
        />
      )}

      {/* Featured banner when resources exist */}
      {resources.length > 0 && (
        <Card className="mt-6 overflow-hidden border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <BookOpen className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-heading text-base font-semibold">Knowledge base for {activeTenant?.name ?? "your organization"}</h2>
                <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
                  Access protocols, handouts, and training materials to support consistent care across all clinic sites.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["Protocol", "PDF", "Article", "Video"] as Resource["type"][]).map((t) => {
                const meta = TYPE_META[t]
                const Icon = meta.icon
                const count = byType[t] ?? 0
                if (count === 0) return null
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      typeFilter === t ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {meta.label} ({count})
                  </button>
                )
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="my-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === "all" ? "All categories" : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="Video">Video</SelectItem>
              <SelectItem value="Article">Article</SelectItem>
              <SelectItem value="Protocol">Protocol</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              category === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">No resources found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {resources.length === 0
              ? "Your organization hasn't added any resources yet."
              : "Try adjusting your search or filters."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  )
}

function ResourceCard({ resource }: { resource: Resource }) {
  const meta = TYPE_META[resource.type]
  const Icon = meta.icon

  return (
    <Card className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3 border-b border-border p-5">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", meta.color)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading text-sm font-semibold leading-snug">{resource.title}</h3>
            <Badge variant="outline" className="shrink-0 text-[10px]">
              {meta.label}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{resource.category}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex-1 text-sm text-muted-foreground leading-relaxed">{resource.description}</p>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="text-xs text-muted-foreground">Updated {formatDate(resource.updatedAt)}</span>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-primary opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => toast.info(`Opening "${resource.title}" (demo)`)}
          >
            Open <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

function AddResourceForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void
  onSave: (data: Omit<Resource, "id" | "tenantId" | "updatedAt">) => void
}) {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Clinical Protocol")
  const [type, setType] = useState<Resource["type"]>("Protocol")
  const [description, setDescription] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required")
      return
    }
    onSave({ title: title.trim(), category, type, description: description.trim() })
  }

  return (
    <Card className="mt-6 p-5">
      <h3 className="font-heading text-base font-semibold">Add new resource</h3>
      <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="res-title">Title</Label>
          <Input id="res-title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" placeholder="Resource title" />
        </div>
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Clinical Protocol">Clinical Protocol</SelectItem>
              <SelectItem value="Patient Education">Patient Education</SelectItem>
              <SelectItem value="Training">Training</SelectItem>
              <SelectItem value="Reference">Reference</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as Resource["type"])}>
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Protocol">Protocol</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="Article">Article</SelectItem>
              <SelectItem value="Video">Video</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="res-desc">Description</Label>
          <Textarea id="res-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5" rows={3} placeholder="Brief description of the resource…" />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit">Save resource</Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
