import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bibliotecas.muga.dev"
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/catalogo", "/explorar", "/libro/"],
      disallow: ["/admin", "/bases-de-datos", "/buscar", "/configuracion", "/importar", "/prestamos", "/api/"],
    },
    sitemap: `${baseUrl.replace(/\/$/, "")}/sitemap.xml`,
  }
}
