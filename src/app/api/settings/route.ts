import { requireApiAdmin } from "@/lib/api/auth"
import { apiError, apiSuccess, parseJsonBody } from "@/lib/api/http"
import { updateSettingsSchema } from "@/lib/api/schemas"
import { getLoanConfig, upsertLoanConfigEntries } from "@/lib/services/database"

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
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  try {
    const rows = await getLoanConfig()
    return apiSuccess({ settings: toSettingsMap(rows as Array<{ key: string; value: string }>) })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return apiError(500, "SETTINGS_FETCH_FAILED", "Failed to fetch settings")
  }
}

export async function PUT(request: Request) {
  const auth = await requireApiAdmin()
  if (!auth.ok) return auth.response

  const parsed = await parseJsonBody(request, updateSettingsSchema)
  if (!parsed.success) return parsed.response

  const settings = {
    ...DEFAULT_SETTINGS,
    ...parsed.data.settings,
  }

  try {
    await upsertLoanConfigEntries({
      notifications_enabled: String(settings.notificaciones),
      email_notifications: String(settings.emailNotifications),
      auto_backup: String(settings.autoBackup),
      items_per_page: settings.itemsPerPage,
      cataloging_standard: settings.catalogingStandard,
      classification_standard: settings.classificationStandard,
    })

    return apiSuccess({ settings })
  } catch (error) {
    console.error("Error updating settings:", error)
    return apiError(500, "SETTINGS_UPDATE_FAILED", "Failed to update settings")
  }
}
