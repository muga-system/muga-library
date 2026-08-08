import path from "node:path"

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  agentRules: false,
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(process.cwd(), "src"),
    }
    return config
  },
  outputFileTracingExcludes: {
    "*": ["./data/**", "./backups/**", "./.env*", "./.git/**"],
  },
  outputFileTracingIncludes: {
    "/*": ["./node_modules/next/dist/lib/metadata/**/*", "./drizzle/**/*"],
  },
  async headers() {
    const privateNoStore = [
      { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
    ]

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      ...[
        "/",
        "/admin/:path*",
        "/bases-de-datos/:path*",
        "/buscar/:path*",
        "/catalogo/:path*",
        "/configuracion/:path*",
        "/cdu/:path*",
        "/importar/:path*",
        "/libro/:path*",
        "/mis-solicitudes/:path*",
        "/prestamos/:path*",
        "/solicitar/:path*",
        "/api/auth/:path*",
        "/api/admin/:path*",
        "/api/coupon-requests",
        "/api/coupons/:path*",
        "/api/databases/:path*",
        "/api/loans/:path*",
        "/api/my/:path*",
        "/api/records/:path*",
        "/api/settings",
        "/api/uploads",
      ].map((source) => ({ source, headers: privateNoStore })),
    ]
  },
}

export default nextConfig
