"use client"

import { useState } from "react"
import Image from "next/image"
import { ZoomIn, ZoomOut, Sun, RotateCcw, Ruler } from "lucide-react"
import type { LesionImage } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn, formatImageUrl } from "@/lib/utils"

// Clinical image review tool: zoom, brightness and side-by-side thumbnails.
// Mirrors the specialist "image analysis" tools described in the concept doc.
export function ImageViewer({ images }: { images: LesionImage[] }) {
  const [active, setActive] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [brightness, setBrightness] = useState(100)
  const [measure, setMeasure] = useState(false)

  const current = images[active]

  const reset = () => {
    setZoom(1)
    setBrightness(100)
    setMeasure(false)
  }

  if (!current) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        No images captured for this case.
      </div>
    )
  }

  return (
    <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-foreground/5">
        <div
          className="absolute inset-0 transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, filter: `brightness(${brightness}%)` }}
        >
          <Image
            src={formatImageUrl(current.url)}
            alt={`Lesion image — ${current.angle}`}
            fill
            className="object-contain"
            sizes="(min-width: 1024px) 640px, 100vw"
            unoptimized
          />
        </div>

        {measure && (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-px w-40 -translate-x-1/2 -translate-y-1/2 bg-warning" />
            <span className="absolute left-1/2 top-1/2 mt-2 -translate-x-1/2 rounded bg-warning px-1.5 py-0.5 text-[10px] font-semibold text-warning-foreground">
              ~ 24 mm (est.)
            </span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
            {current.angle}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium backdrop-blur",
              current.qualityScore >= 80
                ? "bg-success/85 text-success-foreground"
                : current.qualityScore >= 70
                  ? "bg-warning/85 text-warning-foreground"
                  : "bg-destructive/85 text-destructive-foreground",
            )}
          >
            Quality {current.qualityScore}
          </span>
        </div>

        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg bg-background/90 p-1 shadow-sm backdrop-blur">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.min(3, z + 0.25))} aria-label="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.max(1, z - 0.25))} aria-label="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setBrightness((b) => (b >= 140 ? 100 : b + 20))}
            aria-label="Adjust brightness"
          >
            <Sun className="h-4 w-4" />
          </Button>
          <Button
            variant={measure ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setMeasure((m) => !m)}
            aria-label="Measure"
          >
            <Ruler className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={reset} aria-label="Reset view">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {current.qualityNotes && (
        <p className="mt-2 text-xs text-warning-foreground">Note: {current.qualityNotes}</p>
      )}

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => {
                setActive(i)
                reset()
              }}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border-2 transition-colors",
                i === active ? "border-primary" : "border-transparent hover:border-border",
              )}
              aria-label={`View ${img.angle} image`}
            >
              <Image src={formatImageUrl(img.url)} alt="" fill className="object-cover" sizes="80px" unoptimized />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
