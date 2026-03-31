import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

const AUTH_ONLY_PATHS = [
  "/",
  "/libro",
  "/solicitar",
  "/mis-solicitudes",
]

const ADMIN_ONLY_PATHS = [
  "/admin",
  "/bases-de-datos",
  "/buscar",
  "/cdu",
  "/configuracion",
  "/importar",
  "/prestamos",
]

const PUBLIC_PATHS = [
  "/iniciar-sesion",
  "/activar",
  "/solicitar-cupon",
  "/explorar",
  "/registro",
]

function startsWithPath(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`)
}

function isAuthOnlyPath(pathname: string) {
  return AUTH_ONLY_PATHS.some((path) => startsWithPath(pathname, path))
}

function isAdminOnlyPath(pathname: string) {
  return ADMIN_ONLY_PATHS.some((path) => startsWithPath(pathname, path))
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => startsWithPath(pathname, path))
}

function isAdmin(user: { app_metadata?: any; user_metadata?: any }) {
  const appRole = String(user?.app_metadata?.role || "").toLowerCase()
  const userRole = String(user?.user_metadata?.role || "").toLowerCase()
  return appRole === "admin" || userRole === "admin"
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } })
  const pathname = request.nextUrl.pathname

  if (isPublicPath(pathname)) {
    return response
  }

  if (!isAuthOnlyPath(pathname) && !isAdminOnlyPath(pathname)) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const isAdminPath = isAdminOnlyPath(pathname)
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null = null

  if (isAdminPath) {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } else {
    const { data } = await supabase.auth.getSession()
    user = data.session?.user || null
  }

  if (pathname === "/iniciar-sesion" && user) {
    const next = request.nextUrl.searchParams.get("next")
    const redirectUrl = next || (isAdmin(user) ? "/admin" : "/")
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  if (isAuthOnlyPath(pathname) || isAdminOnlyPath(pathname)) {
    if (!user) {
      const url = new URL("/iniciar-sesion", request.url)
      url.searchParams.set("next", pathname + request.nextUrl.search)
      return NextResponse.redirect(url)
    }
  }

  if (isAdminOnlyPath(pathname) && user && !isAdmin(user)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/",
    "/iniciar-sesion",
    "/activar",
    "/solicitar-cupon",
    "/explorar",
    "/registro",
    "/admin/:path*",
    "/libro/:path*",
    "/solicitar/:path*",
    "/mis-solicitudes/:path*",
    "/bases-de-datos/:path*",
    "/buscar/:path*",
    "/cdu/:path*",
    "/configuracion/:path*",
    "/importar/:path*",
    "/prestamos/:path*",
  ],
}
