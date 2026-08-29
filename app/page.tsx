import Link from "next/link"
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Globe,
  ImageIcon,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Microscope,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react"
import { SkinLinkLogo, SkinLinkMark } from "@/components/brand/logo"

// ─────────────────────────────────────────────────────────────────────────────
// Landing page — SkinLink teledermatology platform
// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-foreground antialiased overflow-x-hidden">
      <Navbar />
      <Hero />
      <TrustBar />
      <HowItWorks />
      <AccountTypes />
      <Features />
      <AiSection />
      <ForSpecialists />
      <Testimonials />
      <Pricing />
      <Faq />
      <Cta />
      <Footer />
    </div>
  )
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <SkinLinkLogo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          <a href="#how-it-works" className="transition-colors hover:text-primary">How it works</a>
          <a href="#account-types" className="transition-colors hover:text-primary">Account types</a>
          <a href="#pricing" className="transition-colors hover:text-primary">Pricing</a>
          <a href="#for-specialists" className="transition-colors hover:text-primary">For specialists</a>
          <Link href="/api-docs" className="transition-colors hover:text-primary">API</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-slate-950 via-[#0c2340] to-[#0f3460]">
      {/* Background texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 30%, rgba(31,122,140,0.35) 0, transparent 45%), radial-gradient(circle at 85% 70%, rgba(43,76,126,0.3) 0, transparent 50%), radial-gradient(circle at 50% 100%, rgba(15,52,96,0.5) 0, transparent 60%)",
        }}
      />
      {/* Grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-20 sm:px-6 sm:pt-28 lg:px-8 lg:pt-36">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-teal-300">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Teledermatology
          </div>

          <h1 className="font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-balance text-white sm:text-5xl lg:text-6xl">
            Specialist dermatology care{" "}
            <span className="bg-gradient-to-r from-teal-300 to-cyan-400 bg-clip-text text-transparent">
              connected to every clinic
            </span>
          </h1>

          <p className="mt-6 text-base leading-relaxed text-slate-300/80 text-pretty sm:text-lg">
            SkinLink bridges village health posts and rural clinics to specialist dermatologists
            through secure digital referrals — AI image quality checks, structured triage,
            treatment guidance and follow-up, all inside one HIPAA-ready workspace.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-teal-900/40 transition-all hover:bg-teal-400 hover:shadow-xl sm:w-auto"
            >
              Create free account <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/10 sm:w-auto"
            >
              See how it works
            </a>
          </div>

          {/* Social proof micro-stats */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400">
            {[
              { value: "12,000+", label: "Cases reviewed" },
              { value: "98%", label: "Specialist satisfaction" },
              { value: "< 24 h", label: "Avg. triage time" },
              { value: "40+", label: "Partner clinics" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-0.5">
                <span className="text-xl font-extrabold text-white">{s.value}</span>
                <span className="text-xs">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-800/60 shadow-2xl shadow-black/50 backdrop-blur ring-1 ring-white/10">
            {/* Fake browser bar */}
            <div className="flex h-10 items-center gap-2 border-b border-white/10 bg-slate-900/80 px-4">
              <span className="h-3 w-3 rounded-full bg-red-500/70" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <span className="h-3 w-3 rounded-full bg-green-500/70" />
              <span className="mx-auto rounded-md bg-slate-700/60 px-8 py-0.5 text-[11px] text-slate-400">
                app.skinlink.health/dashboard
              </span>
            </div>
            {/* Dashboard preview */}
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              {/* Stat cards */}
              {[
                { label: "New referrals", value: "14", icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" },
                { label: "Pending review", value: "6", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
                { label: "Resolved today", value: "9", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
              ].map((card) => (
                <div key={card.label} className="rounded-xl bg-slate-700/50 p-4">
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${card.bg}`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-white">{card.value}</p>
                  <p className="text-xs text-slate-400">{card.label}</p>
                </div>
              ))}
              {/* AI panel */}
              <div className="rounded-xl bg-slate-700/50 p-4 sm:col-span-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-300">
                  <Sparkles className="h-3.5 w-3.5" /> AI-Assist suggestion · Beta
                </div>
                <p className="mt-2 text-xs font-semibold text-white">Top differential diagnosis</p>
                {[
                  { cond: "Atopic Dermatitis", pct: 78 },
                  { cond: "Allergic Contact Dermatitis", pct: 54 },
                  { cond: "Psoriasis (plaque)", pct: 21 },
                ].map((d) => (
                  <div key={d.cond} className="mt-2">
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>{d.cond}</span><span>{d.pct}%</span>
                    </div>
                    <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-600">
                      <div className="h-full rounded-full bg-teal-400" style={{ width: `${d.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {/* Image quality */}
              <div className="rounded-xl bg-slate-700/50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <ImageIcon className="h-3.5 w-3.5" /> Image quality
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-600">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-emerald-400">87/100</p>
                    <p className="text-[11px] text-slate-400">Good quality</p>
                    <span className="mt-1 inline-block rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">Passed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow effect under mockup */}
          <div aria-hidden className="absolute -bottom-10 left-1/2 h-24 w-2/3 -translate-x-1/2 rounded-full bg-teal-500/20 blur-3xl" />
        </div>
      </div>
    </section>
  )
}

// ─── Trust bar ────────────────────────────────────────────────────────────────
function TrustBar() {
  const logos = [
    "Ministry of Health", "WHO Digital Health", "KEMRI", "Aga Khan Health", "AMREF", "MSF Telemedicine",
  ]
  return (
    <section className="border-y border-slate-100 bg-slate-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
          Trusted by health programmes across East Africa
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {logos.map((name) => (
            <span key={name} className="text-sm font-semibold text-slate-400">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Clinician submits a referral",
      body: "A health worker at a rural clinic captures clinical photos, documents symptoms, and submits a structured digital referral via the SkinLink mobile app — no specialist required on-site.",
      icon: FileText,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      step: "02",
      title: "AI pre-screens quality & triage",
      body: "GPT-4o Vision checks every image for focus, lighting and lesion visibility. The AI generates a differential diagnosis and urgency flag to help the specialist prioritise instantly.",
      icon: Sparkles,
      color: "bg-teal-500/10 text-teal-600",
    },
    {
      step: "03",
      title: "Specialist reviews & decides",
      body: "A dermatologist reviews the AI suggestion alongside the clinical data, confirms or overrides the assessment, and issues a treatment plan — often in under an hour.",
      icon: Microscope,
      color: "bg-violet-500/10 text-violet-600",
    },
    {
      step: "04",
      title: "Treatment guidance delivered",
      body: "The clinician receives step-by-step treatment instructions and a follow-up schedule. Progress is tracked and specialist feedback closes the loop automatically.",
      icon: Activity,
      color: "bg-emerald-500/10 text-emerald-600",
    },
  ]

  return (
    <section id="how-it-works" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="How it works"
          title="From remote clinic to specialist review in four steps"
          subtitle="SkinLink removes geography as a barrier to quality dermatology care."
        />
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.step} className="group relative">
              {i < steps.length - 1 && (
                <div aria-hidden className="absolute right-0 top-7 hidden h-px w-8 bg-slate-200 lg:block" />
              )}
              <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${s.color} ring-1 ring-inset ring-current/10`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold tracking-widest text-slate-400">{s.step}</span>
                <h3 className="mt-1 text-base font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon: ImageIcon,
      title: "AI image quality gate",
      body: "Every photo is scored for focus, lighting and lesion visibility before the specialist opens the case — no wasted review time on blurry images.",
      color: "bg-sky-50 text-sky-600",
    },
    {
      icon: Sparkles,
      title: "GPT-4o differential diagnosis",
      body: "Structured AI assessment ranks possible conditions by likelihood, flags red-flag features, and suggests urgency — all as decision support, never replacing the specialist.",
      color: "bg-teal-50 text-teal-600",
    },
    {
      icon: LayoutDashboard,
      title: "Specialist dashboard",
      body: "Prioritised case queue, filterable by urgency and status. Inline AI panel, image gallery, treatment plan builder and follow-up scheduler in one view.",
      color: "bg-violet-50 text-violet-600",
    },
    {
      icon: Users,
      title: "Multi-tenant isolation",
      body: "Each organisation gets its own isolated workspace. Platform admins manage tenants, plans, seats and branding. No data leaks across organisations.",
      color: "bg-amber-50 text-amber-600",
    },
    {
      icon: Lock,
      title: "Role-based access control",
      body: "Granular roles for platform admins, org admins, specialists and clinicians. Every action is gated, audited and logged.",
      color: "bg-rose-50 text-rose-600",
    },
    {
      icon: Globe,
      title: "Mobile-first for field workers",
      body: "The Flutter mobile app works offline, syncs when connected, and guides clinicians through structured capture with real-time quality feedback.",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: MessageSquare,
      title: "Structured follow-up",
      body: "Scheduled follow-ups are tracked automatically. Clinicians submit progress reports; specialists respond with feedback without re-opening a fresh referral.",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: Shield,
      title: "Audit trail",
      body: "Every AI assessment, specialist decision and case update is logged with timestamps, model version and clinical inputs — ready for clinical governance review.",
      color: "bg-slate-100 text-slate-600",
    },
  ]

  return (
    <section id="features" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Platform features"
          title="Everything a teledermatology programme needs"
          subtitle="Built for the full referral lifecycle — from first photo to final discharge."
        />
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.color}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── AI section ───────────────────────────────────────────────────────────────
function AiSection() {
  return (
    <section id="ai" className="overflow-hidden py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Text */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-teal-700">
              <Sparkles className="h-3.5 w-3.5" /> Powered by GPT-4o Vision
            </span>
            <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              AI that supports specialists, not replaces them
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-500">
              SkinLink AI acts as a first-pass reviewer. Every case gets an automated differential
              ranking, image quality score, and urgency triage — reducing review time and helping
              specialists focus on complex decisions.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: ImageIcon, title: "Image quality scoring", body: "Focus, lighting, lesion visibility and cropping — scored 0-100 per photo with actionable feedback." },
                { icon: Microscope, title: "Differential diagnosis", body: "Top 3–5 possible conditions ranked by likelihood with clinical rationale for each." },
                { icon: Zap, title: "Urgency triage", body: "Routine / Urgent / Emergency classification surfaced instantly on case open." },
                { icon: ShieldCheck, title: "Red flag detection", body: "Signals like irregular pigmentation, rapid growth or satellite lesions are flagged before specialist review." },
              ].map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-slate-400">
              AI output is clearly labelled as decision support. The responsible specialist always confirms or overrides the suggestion before it becomes part of the clinical record.
            </p>
          </div>

          {/* AI Panel mockup */}
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/80">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">AI-assist suggestion</p>
                    <p className="text-[11px] text-slate-400">Decision support · not a diagnosis</p>
                  </div>
                </div>
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-700">Beta</span>
              </div>
              <div className="space-y-5 p-5">
                {/* Image quality */}
                <div>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-slate-500">
                      <ImageIcon className="h-3.5 w-3.5" /> Image quality
                    </span>
                    <span className="font-bold text-slate-900">87/100</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: "87%" }} />
                  </div>
                </div>
                {/* Differentials */}
                <div>
                  <p className="mb-3 text-xs font-medium text-slate-500">Top differential</p>
                  {[
                    { cond: "Atopic Dermatitis", pct: 78, conf: "High" },
                    { cond: "Allergic Contact Dermatitis", pct: 54, conf: "Moderate" },
                    { cond: "Psoriasis (plaque)", pct: 21, conf: "Low" },
                  ].map((d) => (
                    <div key={d.cond} className="mb-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-800">{d.cond}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          d.conf === "High" ? "bg-emerald-50 text-emerald-700" :
                          d.conf === "Moderate" ? "bg-amber-50 text-amber-700" :
                          "bg-slate-100 text-slate-500"
                        }`}>{d.conf}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${d.pct}%` }} />
                        </div>
                        <span className="w-8 text-right text-[11px] tabular-nums text-slate-400">{d.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Urgency */}
                <div className="rounded-xl bg-amber-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                      <Shield className="h-3.5 w-3.5" /> Suggested urgency
                    </span>
                    <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-800">Routine</span>
                  </div>
                  <p className="mt-1.5 text-xs text-amber-800/80">
                    Suitable for teledermatology management. Topical corticosteroid trial recommended.
                  </p>
                </div>
                <p className="text-[10px] text-slate-400">
                  Generated by SkinLink AI. The responsible specialist must confirm or reject this suggestion.
                </p>
              </div>
            </div>
            {/* Decorative blur */}
            <div aria-hidden className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-teal-300/20 blur-3xl" />
            <div aria-hidden className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-blue-300/20 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Account types ────────────────────────────────────────────────────────────
function AccountTypes() {
  const types = [
    {
      badge: "Organization",
      icon: LayoutDashboard,
      color: "border-blue-200 bg-blue-50",
      iconColor: "bg-blue-100 text-blue-600",
      badgeColor: "bg-blue-100 text-blue-700",
      title: "Hospital or Clinic",
      description:
        "For hospitals, health centres and district networks. Your org admin manages staff accounts, clinicians submit referrals from the field app, and your assigned dermatologists review cases.",
      points: [
        "One isolated workspace per organisation",
        "Org admin controls users, roles & referral workflow",
        "Clinicians & nurses use the mobile app",
        "Specialists review AI-pre-screened case queue",
        "Packages: Rural Clinic Hub (TZS 250,000/mo) | Regional Hospital (TZS 600,000/mo)",
      ],
      cta: "Register organisation",
      href: "/register?type=org",
    },
    {
      badge: "Solo Specialist",
      icon: Microscope,
      color: "border-teal-200 bg-teal-50",
      iconColor: "bg-teal-100 text-teal-600",
      badgeColor: "bg-teal-100 text-teal-700",
      title: "Independent Dermatologist",
      description:
        "For verified solo or independent dermatologists. Receive remote cases from village workers, review AI assessments, and issue structured treatment plans — on your schedule.",
      points: [
        "Verified professional account (MCT + licence)",
        "Receive cases from remote village clinics",
        "Full AI-assist differential and triage panel",
        "Solo practice workspace with up to 5 seats",
        "Packages: Starter (TZS 150,000/mo) | Pro Specialist (TZS 350,000/mo)",
      ],
      cta: "Apply as specialist",
      href: "/register?type=solo",
    },
  ]

  return (
    <section id="account-types" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Transparent Pricing & Subscription Packages"
          title="Designed for Clinical Impact & Sustainable Practice"
          subtitle="Choose the subscription package that matches your healthcare facility or solo teledermatology practice."
        />
        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {types.map((t) => (
            <div key={t.badge} className={`rounded-2xl border p-8 ${t.color}`}>
              <div className="flex items-center gap-3">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${t.iconColor}`}>
                  <t.icon className="h-6 w-6" />
                </span>
                <div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${t.badgeColor}`}>
                    {t.badge}
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{t.title}</h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">{t.description}</p>
              <ul className="mt-5 space-y-2.5">
                {t.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                href={t.href}
                className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary/90"
              >
                {t.cta} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">
          All accounts are reviewed and approved by the SkinLink platform team before activation.
          Solo dermatologist accounts require professional verification (MCT registration, practising licence, specialist qualification).
        </p>
      </div>
    </section>
  )
}

// ─── For specialists ──────────────────────────────────────────────────────────
function ForSpecialists() {
  return (
    <section id="for-specialists" className="bg-[#0c2340] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-teal-300">
              <Microscope className="h-3.5 w-3.5" /> For Dermatologists
            </span>
            <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Built for<br />dermatologists
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300/80">
              AI-triaged patients arrive with photos, structured history, and an urgency assessment.
              Work remotely on your own schedule. No insurance paperwork — cash-based consultations in TZS.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-6 text-center">
              {[
                { value: "40+", label: "Partner clinics" },
                { value: "TZS", label: "Cash payments" },
                { value: "Flex", label: "Schedule" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-heading text-2xl font-extrabold text-white">{s.value}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 space-y-3">
              {[
                "AI-triaged, pre-screened patients",
                "High-quality clinical images with quality scores",
                "Structured case history and red-flag alerts",
                "Flexible remote & supplemental income",
              ].map((f) => (
                <div key={f} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400" />
                  {f}
                </div>
              ))}
            </div>
            <a href="mailto:integrations@skinlink.health"
            className="flex items-center gap-2 rounded-xl bg-teal-500/20 border border-teal-400/30 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-teal-500/30">
            API documentation <ArrowRight className="h-4 w-4" />
          </a>
          </div>

          {/* eConsult mockup */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-teal-300">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" /> eConsult response
              <span className="ml-auto text-slate-400">18 hrs turnaround</span>
            </div>
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">DC</span>
              <div>
                <p className="text-sm font-semibold text-white">Dr. Amina Juma, MD</p>
                <p className="text-xs text-slate-400">Board-Certified Dermatologist</p>
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-xs">
              {[
                ["Impression", "Consistent with tinea versicolor"],
                ["Recommendation", "Topical antifungal ×4 wks; follow-up PRN"],
                ["ICD-10", "B36.0"],
                ["Urgency", "Routine"],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="w-28 shrink-0 text-slate-400">{k}</dt>
                  <dd className="text-slate-200">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[10px] text-slate-500">
              Peer-to-peer eConsult · Referred by Nurse Fatuma Mwanga, Mbuyuni Dispensary
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const quotes = [
    {
      body: "Before SkinLink, our patients waited three months to see a dermatologist. Now the specialist sees the case within 24 hours and we have a treatment plan the same day. It has completely changed outcomes in our catchment.",
      author: "Dr. Amina Wanjiru",
      role: "Medical Officer, Kajiado County",
      initials: "AW",
      color: "bg-teal-600",
    },
    {
      body: "The AI quality check is a game-changer. It tells the health workers instantly if the photo is blurry or the lesion isn't fully visible — I now get far fewer cases I have to send back for retake.",
      author: "Dr. James Odhiambo",
      role: "Consultant Dermatologist, Nairobi",
      initials: "JO",
      color: "bg-blue-600",
    },
    {
      body: "Managing twenty clinics across three counties used to mean endless WhatsApp groups and paperwork. SkinLink gives me a single dashboard to see every referral, every status, every outcome in real time.",
      author: "Grace Muthoni",
      role: "Regional Health Programme Manager",
      initials: "GM",
      color: "bg-violet-600",
    },
  ]

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="What our users say"
          title="Trusted by clinicians and specialists across the region"
        />
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {quotes.map((q) => (
            <div key={q.author} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">&ldquo;{q.body}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${q.color}`}>
                  {q.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{q.author}</p>
                  <p className="text-xs text-slate-400">{q.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function Pricing() {
  const plans = [
    {
      name: "Pilot",
      price: "TZS 80,000",
      period: "/mwezi",
      description: "Kwa kliniki ndogo na mipango ya majaribio.",
      seats: "Hadi watumiaji 10",
      features: [
        "Workspace moja ya shirika",
        "Viti 10 — wataalam na matabibu",
        "Ukaguzi wa ubora wa picha (AI)",
        "Tathmini ya kimsingi ya AI",
        "Msaada wa barua pepe",
      ],
      cta: "Anza bure",
      href: "/register?type=org&plan=pilot",
      highlight: false,
    },
    {
      name: "Growth",
      price: "TZS 250,000",
      period: "/mwezi",
      description: "Kwa mitandao inayokua na wilaya.",
      seats: "Hadi watumiaji 50",
      features: [
        "Workspace moja ya shirika",
        "Viti 50 kwa majukumu yote",
        "Tathmini kamili ya ngozi ya AI",
        "Ripoti za ukaguzi na utawala",
        "Mtiririko wa rufaa uliobinafsishwa",
        "Msaada wa kipaumbele",
      ],
      cta: "Anza bure",
      href: "/register?type=org&plan=growth",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Omba bei",
      period: "",
      description: "Kwa mipango ya kitaifa na mikoa mingi.",
      seats: "Watumiaji wasio na kikomo",
      features: [
        "Mashirika mengi ya wapangaji",
        "Nembo nyeupe na branding ya kibinafsi",
        "Chaguo la toleo la kipekee",
        "SLA na dhamana ya uptime",
        "Mafunzo ya ndani & onboarding",
        "Msimamizi wa akaunti aliyejitolea",
      ],
      cta: "Wasiliana nasi",
      href: "/register?type=org&plan=enterprise",
      highlight: false,
    },
  ]

  return (
    <section id="pricing" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Bei za wazi · TZS"
          title="Mipango rahisi inayokua na programu yako"
          subtitle="Mipango yote inajumuisha majaribio ya bure ya siku 30. Hakuna kadi ya mkopo inayohitajika."
        />
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                plan.highlight
                  ? "border-primary bg-gradient-to-b from-primary to-[#0c2340] text-white shadow-2xl shadow-primary/30"
                  : "border-slate-200 bg-white shadow-sm"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-teal-400 px-4 py-1 text-[11px] font-extrabold uppercase tracking-widest text-teal-950">
                  Maarufu zaidi
                </span>
              )}
              <div>
                <p className={`text-sm font-bold ${plan.highlight ? "text-teal-200" : "text-slate-400"}`}>{plan.name}</p>
                <div className="mt-2 flex items-end gap-1">
                  <span className={`font-heading text-2xl font-extrabold ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`mb-1 text-sm ${plan.highlight ? "text-teal-200" : "text-slate-400"}`}>{plan.period}</span>
                  )}
                </div>
                <p className={`mt-1 text-sm ${plan.highlight ? "text-teal-100/80" : "text-slate-500"}`}>{plan.description}</p>
                <p className={`mt-0.5 text-xs font-semibold ${plan.highlight ? "text-teal-300" : "text-primary"}`}>{plan.seats}</p>
              </div>
              <ul className="mt-7 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-center gap-2.5 text-sm ${plan.highlight ? "text-white/90" : "text-slate-600"}`}>
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${plan.highlight ? "text-teal-300" : "text-emerald-500"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`mt-8 flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all ${
                  plan.highlight
                    ? "bg-white text-primary hover:bg-teal-50 shadow-sm"
                    : "bg-primary text-white hover:bg-primary/90 shadow-sm"
                }`}
              >
                {plan.cta} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">
          Bei zote ni za TZS na zimejumuisha kodi. Solo dermatologist akaunti — maombi yanakaguliwa kibinafsi bila ada ya awali.
        </p>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function Faq() {
  const items = [
    {
      q: "Can we integrate SkinLink with our existing EMR?",
      a: "Yes. Enterprise plans include full API access for EMR integration. SkinLink supports HL7 FHIR R4-compatible exports (Patient, DiagnosticReport, DocumentReference) and webhook event delivery. Growth plan clients get REST API read access and webhooks. Custom connectors for specific systems (OpenMRS, DHIS2, Bahmni, Epic) are developed as part of the Enterprise onboarding. Contact integrations@skinlink.health to get started.",
    },
    {
      q: "Is SkinLink a regulated medical device?",
      a: "The AI output in SkinLink is classified as clinical decision support — not a standalone diagnostic device. Every AI suggestion requires specialist confirmation before it becomes part of the clinical record. Please consult your local regulatory framework for your specific deployment.",
    },
    {
      q: "How is patient data stored and protected?",
      a: "Data is encrypted at rest and in transit. Each organisation has fully isolated storage. The platform is designed to meet HIPAA and GDPR principles. Deployment regions can be selected to keep data in-country.",
    },
    {
      q: "Can the mobile app work in low-connectivity areas?",
      a: "Yes. The Flutter mobile app supports offline capture and queuing. Referrals are submitted automatically when connectivity is restored.",
    },
    {
      q: "What AI model powers the assessments?",
      a: "SkinLink uses a clinical AI model (vision + clinical reasoning) for image analysis. The model receives structured clinical context alongside the photos to produce a grounded differential. AI never replaces specialist confirmation.",
    },
    {
      q: "How is the AI integrated into the specialist workflow?",
      a: "The AI panel is a separate, clearly labelled section in the case view. Specialists see the AI suggestion alongside the raw images and clinical data. They can accept, partially endorse, or override any part of the AI output.",
    },
    {
      q: "Can we integrate SkinLink with our existing EMR?",
      a: "Enterprise plans include API access for EMR integration. We support HL7 FHIR-compatible exports and can develop custom connectors for specific systems.",
    },
  ]

  return (
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="FAQ" title="Frequently asked questions" />
        <div className="mt-12 divide-y divide-slate-200">
          {items.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-semibold text-slate-900 hover:text-primary">
                {item.q}
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function Cta() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0c2340] to-[#1f7a8c] px-8 py-16 text-center shadow-2xl sm:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 50%, rgba(31,122,140,0.6) 0, transparent 50%), radial-gradient(circle at 70% 30%, rgba(43,76,126,0.5) 0, transparent 50%)",
            }}
          />
          <SkinLinkMark className="relative mx-auto mb-5 h-12 w-12" />
          <h2 className="relative font-heading text-3xl font-extrabold tracking-tight text-balance text-white sm:text-4xl">
            Ready to connect your clinics to specialist care?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-base text-slate-300/80">
            Start your 30-day free trial today. No credit card, no complicated setup — your team can be submitting referrals within the hour.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl bg-teal-400 px-8 py-3.5 text-sm font-bold text-slate-900 shadow-lg transition-all hover:bg-teal-300 hover:shadow-xl"
            >
              Create free account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/10"
            >
              Sign in to your workspace
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <SkinLinkLogo />
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Connecting rural clinics to specialist dermatologists through AI-assisted teledermatology.
            </p>
          </div>
          <FooterCol title="Platform" links={["Features", "AI Assist", "Mobile App", "Security"]} />
          <FooterCol title="Company" links={["About", "Blog", "Careers", "Contact"]} />
          <FooterCol title="Legal" links={["Privacy Policy", "Terms of Service", "Cookie Policy", "HIPAA"]} />
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} SkinLink. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">
            AI output is decision support only · not a medical diagnosis
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="text-sm text-slate-500 transition-colors hover:text-slate-900">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Shared section header ────────────────────────────────────────────────────
function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="inline-block rounded-full bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-teal-700">
        {eyebrow}
      </span>
      <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-slate-900 text-balance sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-base leading-relaxed text-slate-500 text-pretty">{subtitle}</p>
      )}
    </div>
  )
}
