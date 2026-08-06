import { redirect } from "next/navigation"
import { getCurrentUser, isAdmin, isLibraryStaff } from "@/lib/auth/service"

export async function requireStaffPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/iniciar-sesion")
  if (!isLibraryStaff(user)) redirect(isAdmin(user) ? "/" : "/mis-solicitudes")
  return user
}

export function staffOwnerId(user: Awaited<ReturnType<typeof requireStaffPage>>) {
  return isAdmin(user) ? undefined : user.id
}
