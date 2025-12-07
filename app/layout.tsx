import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import Script from "next/script"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "Nebula GPA - B.Tech GPA Tracker",
    description: "Track your SGPA, CGPA, and predict future grades with Nebula GPA",

    manifest: "/manifest.json",

    icons: {
        icon: [
            { url: "/logo192.png", sizes: "192x192", type: "image/png" },
            { url: "/logo512.png", sizes: "512x512", type: "image/png" }
        ]
    }
}

export const viewport: Viewport = {
    themeColor: "#0f172a",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
}

export default function RootLayout({
                                       children
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <head>
            {/* PWA Manifest */}
            <link rel="manifest" href="/manifest.json" />

            {/* Required PWA Meta Tags */}
            <meta name="theme-color" content="#0f172a" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
        </head>

        <body className="font-sans antialiased">
        {children}
        <Toaster />
        <Analytics />

        {/* Service Worker Registration */}
        <Script id="service-worker-register" strategy="afterInteractive">
            {`
            if ("serviceWorker" in navigator) {
              window.addEventListener("load", () => {
                navigator.serviceWorker.register("/sw.js")
                  .catch(err => console.error("Service Worker registration failed:", err));
              });
            }
          `}
        </Script>
        </body>
        </html>
    )
}
