import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeFooterToggle } from "@/components/theme-footer-toggle"
import { NotificationsProvider } from "@/components/notifications-provider"
import { ConfirmProvider } from "@/components/confirm-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MUGA Books Register - Sistema de Gestión Bibliotecaria",
  description: "Sistema de gestión bibliotecaria moderno basado en J-ISIS UNESCO con soporte para CDU",
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
                  <div className="mx-auto flex max-w-6xl items-center justify-end px-6 py-2">
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
