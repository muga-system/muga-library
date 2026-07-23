import { NextResponse, type NextRequest } from "next/server"

const AUTH_ONLY_PATHS = ["/solicitar", "/mis-solicitudes"]
const ADMIN_ONLY_PATHS = ["/admin", "/bases-de-datos", "/buscar", "/cdu", "/configuracion", "/importar", "/prestamos"]
const PUBLIC_PATHS = ["/", "/iniciar-sesion", "/activar", "/solicitar-cupon", "/explorar", "/registro", "/catalogo", "/libro"]

function matches(pathname: string, basePath: string) { return pathname === basePath || pathname.startsWith(`${basePath}/`) }
function inPaths(pathname: string, paths: string[]) { return paths.some((path) => matches(pathname, path)) }

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (inPaths(pathname, PUBLIC_PATHS) || (!inPaths(pathname, AUTH_ONLY_PATHS) && !inPaths(pathname, ADMIN_ONLY_PATHS))) return NextResponse.next()
  if (!request.cookies.get("muga_session")?.value) {
    const url = new URL("/iniciar-sesion", request.url)
    url.searchParams.set("next", pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/iniciar-sesion", "/activar", "/solicitar-cupon", "/explorar", "/registro", "/catalogo/:path*", "/admin/:path*", "/libro/:path*", "/solicitar/:path*", "/mis-solicitudes/:path*", "/bases-de-datos/:path*", "/buscar/:path*", "/cdu/:path*", "/configuracion/:path*", "/importar/:path*", "/prestamos/:path*"],
}
