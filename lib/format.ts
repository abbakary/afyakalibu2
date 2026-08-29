export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const abs = Math.abs(diff)
  const future = diff < 0
  const mins = Math.round(abs / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return future ? `in ${mins}m` : `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return future ? `in ${hrs}h` : `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return future ? `in ${days}d` : `${days}d ago`
  const months = Math.round(days / 30)
  return future ? `in ${months}mo` : `${months}mo ago`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
