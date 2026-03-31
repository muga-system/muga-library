import { NextResponse } from "next/server"
import type { ZodSchema } from "zod"

export function apiError(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status })
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  let json: unknown

  try {
    json = await request.json()
  } catch {
    return {
      success: false,
      response: apiError(400, "INVALID_JSON", "Invalid JSON body"),
    }
  }

  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    return {
      success: false,
      response: apiError(400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid request payload"),
    }
  }

  return { success: true, data: parsed.data }
}
