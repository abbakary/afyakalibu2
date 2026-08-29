import { cn } from "@/lib/utils"

// The SkinLink mark: two interlocking "link" strokes forming an S, echoing the
// pitch-deck logo. Uses the teal brand gradient.
export function SkinLinkMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("h-8 w-8", className)} aria-hidden>
      <defs>
        <linearGradient id="sl-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1f7a8c" />
          <stop offset="1" stopColor="#0c2340" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#sl-grad)" />
      <path
        d="M25.5 13.5c-1.8-1.9-4.9-1.9-6.7 0l-3 3.2c-1 1.1-1 2.8 0 3.9"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M14.5 26.5c1.8 1.9 4.9 1.9 6.7 0l3-3.2c1-1.1 1-2.8 0-3.9"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function SkinLinkLogo({
  className,
  variant = "dark",
}: {
  className?: string
  variant?: "dark" | "light"
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <SkinLinkMark className="h-8 w-8" />
      <span
        className={cn(
          "font-heading text-xl font-extrabold tracking-tight",
          variant === "light" ? "text-white" : "text-foreground",
        )}
      >
        Skin<span className="text-primary">Link</span>
      </span>
    </div>
  )
}
