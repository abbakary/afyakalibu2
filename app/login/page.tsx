import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import { MessageSquare } from "lucide-react"

export const metadata: Metadata = {
  title: "Sign in — SkinLink",
  description: "Sign in to your SkinLink tele-dermatology workspace.",
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] px-4 py-12">
      {/* Centered Brand Header */}
      <div className="mb-6">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
            <circle cx="18" cy="18" r="12" stroke="#188594" strokeWidth="4.5" fill="none" />
            <circle cx="18" cy="18" r="4" fill="#188594" />
          </svg>
          <span className="font-heading text-xl font-bold tracking-wider text-[#1e7c8a]">
            SKIN<span className="text-[#0c2340]">LINK</span>
          </span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[430px] rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/60 md:p-10">
        <Suspense fallback={<div className="h-80 flex items-center justify-center text-xs text-slate-400">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>

      {/* Bottom Right Floating Support / Chat Icon */}
      <button
        type="button"
        aria-label="Open support chat"
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#188594] text-white shadow-lg shadow-[#188594]/30 transition-all hover:scale-105 hover:bg-[#136c78] active:scale-95"
      >
        <MessageSquare className="h-5 w-5 fill-white text-[#188594]" />
      </button>
    </main>
  )
}
