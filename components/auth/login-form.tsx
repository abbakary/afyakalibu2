"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Mail, Lock, TriangleAlert, ChevronDown, ChevronUp, UserCheck } from "lucide-react"
import { useData } from "@/lib/data-store"

const DEMO_ACCOUNTS = [
  { label: "Platform operator", role: "Operator", email: "ops@skinlink.io", password: "platform123" },
  { label: "Org admin (Mwanza)", role: "Admin", email: "amina@mwanzahealth.org", password: "clinic123" },
  { label: "Specialist (Mwanza)", role: "Specialist", email: "dr.james@mwanzahealth.org", password: "clinic123" },
  { label: "Clinician (Mwanza)", role: "Nurse", email: "neema@mwanzahealth.org", password: "clinic123" },
]

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { login, isAuthenticated, isPlatformAdmin, authReady } = useData()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showDemos, setShowDemos] = useState(false)

  const next = params.get("next")

  useEffect(() => {
    if (authReady && isAuthenticated) {
      router.replace(next || (isPlatformAdmin ? "/provider" : "/dashboard"))
    }
  }, [authReady, isAuthenticated, isPlatformAdmin, next, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await login(email, password)
    if (!result.ok) {
      setError(result.error ?? "Unable to sign in.")
      setSubmitting(false)
      return
    }
    if (result.user?.role === "clinician") {
      setError("Clinician & Village Health Worker accounts are restricted to the SkinLink Mobile App. Please sign in via the mobile application.")
      setSubmitting(false)
      return
    }
    const dest = next || (result.user?.role === "platform_admin" ? "/provider" : "/dashboard")
    router.replace(dest)
  }

  function useDemo(acc: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(acc.email)
    setPassword(acc.password)
    setError(null)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-1.5 text-xs font-medium text-slate-500">Sign in to your SkinLink account</p>
        <p className="mt-1 text-[11px] font-semibold text-[#188594]">
          Verified clinical credentials & active subscription required for web portal access.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* EMAIL */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
            EMAIL
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/40 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#188594] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#188594]/20 transition-all"
              required
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
            PASSWORD
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/40 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#188594] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#188594]/20 transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex justify-end pt-0.5">
            <a href="#" className="text-[11px] font-semibold text-[#188594] hover:text-[#136c78] hover:underline">
              Forgot password?
            </a>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-destructive">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex w-full items-center justify-center rounded-full bg-[#188594] py-3 text-sm font-bold text-white shadow-md shadow-[#188594]/25 transition-all hover:bg-[#136c78] active:scale-[0.99] disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : "Sign In"}
        </button>
      </form>

      {/* Don't have an account? Get started */}
      <p className="mt-5 text-center text-xs font-medium text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-bold text-[#188594] hover:text-[#136c78] hover:underline">
          Get started
        </Link>
      </p>

      {/* Collapsible Demo Accounts Selector for Testing */}
     
    </div>
  )
}
