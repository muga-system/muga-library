import { requireApiStaff } from "@/lib/api/auth"
import { apiError, apiSuccess, parseJsonBody } from "@/lib/api/http"
import { updateSettingsSchema } from "@/lib/api/schemas"
import { getLoanConfig, upsertLoanConfigEntries } from "@/lib/services/database"
import { getProfileById, updateProfile } from "@/lib/services/profiles"

export const dynamic = "force-dynamic"

const DEFAULT_SETTINGS = {
  notificaciones: true,
  emailNotifications: true,
  autoBackup: false,
  itemsPerPage: "50",
  catalogingStandard: "MARC 21",
  classificationStandard: "CDU - Clasificación Decimal Universal",
} as const

function toSettingsMap(rows: Array<{ key: string; value: string }>) {
  const map = new Map(rows.map((row) => [row.key, row.value]))

  return {
    notificaciones: (map.get("notifications_enabled") ?? String(DEFAULT_SETTINGS.notificaciones)) === "true",
    emailNotifications: (map.get("email_notifications") ?? String(DEFAULT_SETTINGS.emailNotifications)) === "true",
    autoBackup: (map.get("auto_backup") ?? String(DEFAULT_SETTINGS.autoBackup)) === "true",
    itemsPerPage: (map.get("items_per_page") ?? DEFAULT_SETTINGS.itemsPerPage) as "25" | "50" | "100",
    catalogingStandard: map.get("cataloging_standard") ?? DEFAULT_SETTINGS.catalogingStandard,
    classificationStandard: map.get("classification_standard") ?? DEFAULT_SETTINGS.classificationStandard,
  }
}

export async function GET() {
  const auth = await requireApiStaff()
  if (!auth.ok) return auth.response

  try {
    const rows = await getLoanConfig()
    return apiSuccess({
      settings: toSettingsMap(rows as Array<{ key: string; value: string }>),
      profile: await getProfileById(auth.user.id),
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return apiError(500, "SETTINGS_FETCH_FAILED", "Failed to fetch settings")
  }
}

export async function PUT(request: Request) {
  const auth = await requireApiStaff()
  if (!auth.ok) return auth.response

  const parsed = await parseJsonBody(request, updateSettingsSchema)
  if (!parsed.success) return parsed.response

  try {
    const settings = parsed.data.settings
      ? { ...DEFAULT_SETTINGS, ...parsed.data.settings }
      : null
    if (settings) {
      await upsertLoanConfigEntries({
        notifications_enabled: String(settings.notificaciones),
        email_notifications: String(settings.emailNotifications),
        auto_backup: String(settings.autoBackup),
        items_per_page: settings.itemsPerPage,
        cataloging_standard: settings.catalogingStandard,
        classification_standard: settings.classificationStandard,
      })
    }

    const profile = parsed.data.profile
      ? await updateProfile(auth.user.id, {
          fullName: parsed.data.profile.full_name,
          libraryName: parsed.data.profile.library_name,
          avatarUrl: parsed.data.profile.avatar_url,
          email: parsed.data.profile.email,
          password: parsed.data.profile.password,
          currentPassword: parsed.data.profile.current_password,
        })
      : await getProfileById(auth.user.id)

    return apiSuccess({ settings, profile })
  } catch (error) {
    if (error instanceof Error && error.message === "CURRENT_PASSWORD_INVALID") {
      return apiError(400, "CURRENT_PASSWORD_INVALID", "La contraseña actual no es válida")
    }
    if (error instanceof Error && error.message === "EMAIL_ALREADY_REGISTERED") {
      return apiError(409, "EMAIL_ALREADY_REGISTERED", "Este email ya está registrado")
    }
    if (error instanceof Error && error.message === "PROFILE_NOT_FOUND") {
      return apiError(404, "PROFILE_NOT_FOUND", "Profile not found")
    }
    console.error("Error updating settings:", error)
    return apiError(500, "SETTINGS_UPDATE_FAILED", "Failed to update settings")
  }
}
