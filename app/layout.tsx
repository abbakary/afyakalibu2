import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { DataProvider } from "@/lib/data-store"
import "./globals.css"

export const metadata: Metadata = {
  title: "SkinLink — Tele-dermatology Management Platform",
  description:
    "SkinLink connects village clinics to dermatology specialists through secure digital referrals. Specialist dashboard for fast triage, review, treatment guidance and follow-up.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#0c2340",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased">
        <DataProvider>{children}</DataProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
