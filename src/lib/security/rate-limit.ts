import { apiError } from "@/lib/api/http"

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown"
}

export function rateLimit(request: Request, key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const bucketKey = `${key}:${clientIp(request)}`
  const current = buckets.get(bucketKey)
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current

  bucket.count += 1
  buckets.set(bucketKey, bucket)

  if (buckets.size > 5000) {
    for (const [key, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(key)
    }
  }

  if (bucket.count > limit) {
    return apiError(429, "RATE_LIMITED", "Demasiadas solicitudes. Intentá nuevamente más tarde.")
  }
  return null
}
