import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeFooterToggle } from "@/components/theme-footer-toggle"
import { NotificationsProvider } from "@/components/notifications-provider"
import { ConfirmProvider } from "@/components/confirm-provider"
import Link from "next/link"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://bibliotecas.muga.dev"),
  title: {
    default: "MUGA Bibliotecas",
    template: "%s | MUGA Bibliotecas",
  },
  description: "Gestión bibliotecaria para catalogar, prestar y publicar colecciones con control por biblioteca.",
  applicationName: "MUGA Bibliotecas",
  generator: "Next.js",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "MUGA Bibliotecas",
    title: "MUGA Bibliotecas",
    description: "Gestión bibliotecaria para catalogar, prestar y publicar colecciones.",
  },
  twitter: {
    card: "summary",
    title: "MUGA Bibliotecas",
    description: "Gestión bibliotecaria para catalogar, prestar y publicar colecciones.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} min-h-dvh flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))]`}>
        <ThemeProvider>
          <NotificationsProvider>
            <ConfirmProvider>
              <AuthProvider>
                <main className="flex-1">{children}</main>
                <footer className="border-t border-slate-200/70 bg-transparent dark:border-slate-800/70">
                  <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-2">
                    <nav className="flex items-center gap-3 text-xs text-slate-500">
                      <Link href="/privacidad" className="hover:text-slate-900 dark:hover:text-slate-200">Privacidad</Link>
                      <Link href="/terminos" className="hover:text-slate-900 dark:hover:text-slate-200">Términos</Link>
                    </nav>
                    <ThemeFooterToggle />
                  </div>
                </footer>
              </AuthProvider>
            </ConfirmProvider>
          </NotificationsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
