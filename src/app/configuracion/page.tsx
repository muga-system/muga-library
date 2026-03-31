"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, User, Building2, Bell, Shield, Download, Save, Check, Camera } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useNotifications } from "@/components/notifications-provider"

export default function ConfiguracionPage() {
  const supabase = createClient()
  const notifications = useNotifications()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("perfil")
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [profile, setProfile] = useState({
    nombre: "",
    email: "",
    newEmail: "",
    biblioteca: "",
    avatarUrl: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [settings, setSettings] = useState({
    notificaciones: true,
    emailNotifications: true,
    autoBackup: false,
    itemsPerPage: "50",
    catalogingStandard: "MARC 21",
    classificationStandard: "CDU - Clasificación Decimal Universal",
  })

  useEffect(() => {
    loadUser()
    loadSettings()
  }, [])

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      setProfile({
        nombre: user.user_metadata?.full_name || "",
        email: user.email || "",
        newEmail: "",
        biblioteca: user.user_metadata?.biblioteca || "",
        avatarUrl: user.user_metadata?.avatar_url || "",
        newPassword: "",
        confirmPassword: "",
      })
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'SETTINGS_FETCH_FAILED')

      if (data?.settings) {
        setSettings((prev) => ({ ...prev, ...data.settings }))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  async function handleAvatarUpload(file: File) {
    if (!user?.id) return

    const mime = file.type.toLowerCase()
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mime)) {
      notifications.warning("Formato no soportado", "Sube una imagen JPG, PNG, WEBP o GIF.")
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      notifications.warning("Archivo muy grande", "La imagen debe pesar menos de 3MB.")
      return
    }

    try {
      const extension = file.name.split(".").pop() || "jpg"
      const path = `${user.id}/${Date.now()}.${extension}`

      let uploadResult = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true })

      if (uploadResult.error?.message?.toLowerCase().includes("bucket not found")) {
        const ensureBucket = await fetch('/api/storage/avatar-bucket', { method: 'POST' })
        if (ensureBucket.ok) {
          uploadResult = await supabase.storage
            .from("avatars")
            .upload(path, file, { upsert: true })
        }
      }

      if (uploadResult.error) throw uploadResult.error

      const { data } = supabase.storage.from("avatars").getPublicUrl(path)
      if (!data?.publicUrl) throw new Error("No se pudo obtener URL de la imagen")

      setProfile((prev) => ({ ...prev, avatarUrl: data.publicUrl }))
      notifications.success("Imagen cargada", "Guarda cambios para aplicar la foto del perfil.")
    } catch (error) {
      notifications.error("No se pudo subir la imagen", "Verifica que exista el bucket 'avatars' en Supabase Storage.")
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (activeTab === "perfil") {
        if (profile.newPassword && profile.newPassword.length < 8) {
          notifications.warning("Contrasena insegura", "La nueva contrasena debe tener al menos 8 caracteres.")
          setSaving(false)
          return
        }

        if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
          notifications.warning("Contrasenas no coinciden", "Revisa los campos de nueva contrasena.")
          setSaving(false)
          return
        }

        const payload: {
          data: Record<string, string>
          email?: string
          password?: string
        } = {
          data: {
            full_name: profile.nombre,
            biblioteca: profile.biblioteca,
            avatar_url: profile.avatarUrl,
          },
        }

        if (profile.newEmail.trim()) {
          payload.email = profile.newEmail.trim()
        }

        if (profile.newPassword.trim()) {
          payload.password = profile.newPassword.trim()
        }

        const { error } = await supabase.auth.updateUser(payload)

        if (error) throw error

        if (profile.newEmail.trim()) {
          notifications.info("Cambio de email solicitado", "Revisa tu correo para confirmar el nuevo email.")
        }

        setProfile((prev) => ({
          ...prev,
          newEmail: "",
          newPassword: "",
          confirmPassword: "",
        }))
      } else {
        const payload =
          activeTab === "biblioteca"
            ? {
                settings: {
                  itemsPerPage: settings.itemsPerPage,
                  catalogingStandard: settings.catalogingStandard,
                  classificationStandard: settings.classificationStandard,
                },
              }
            : activeTab === "notificaciones"
              ? {
                  settings: {
                    notificaciones: settings.notificaciones,
                    emailNotifications: settings.emailNotifications,
                  },
                }
              : {
                  settings: {
                    autoBackup: settings.autoBackup,
                  },
                }

        const res = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'SETTINGS_UPDATE_FAILED')

        if (data?.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }))
        }
      }

      notifications.success('Configuracion guardada')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Error saving settings:', error)
      notifications.error('No se pudo guardar', 'Intenta nuevamente en unos segundos.')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: "perfil", label: "Perfil", icon: User },
    { id: "biblioteca", label: "Biblioteca", icon: Building2 },
    { id: "notificaciones", label: "Notificaciones", icon: Bell },
    { id: "avanzado", label: "Avanzado", icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Configuración</h1>
              <p className="text-xs text-slate-500">Administra tu cuenta y preferencias</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-56 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === tab.id
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === "perfil" && (
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Información Personal</h2>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                      {profile.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Foto de perfil</p>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="inline-flex items-center gap-1 text-sm text-slate-700 hover:text-slate-900 underline"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Subir imagen
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (file) {
                            handleAvatarUpload(file)
                          }
                          event.currentTarget.value = ""
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        URL del avatar
                      </label>
                      <input
                        type="url"
                        value={profile.avatarUrl}
                        onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        value={profile.nombre}
                        onChange={(e) => setProfile({ ...profile, nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Nuevo correo electrónico
                      </label>
                      <input
                        type="email"
                        value={profile.newEmail}
                        onChange={(e) => setProfile({ ...profile, newEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        placeholder="nuevo@correo.com"
                      />
                      <p className="mt-1 text-xs text-slate-500">Recibirás un email para confirmar el cambio.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Nueva contrasena
                        </label>
                        <input
                          type="password"
                          value={profile.newPassword}
                          onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                          placeholder="Minimo 8 caracteres"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Confirmar contrasena
                        </label>
                        <input
                          type="password"
                          value={profile.confirmPassword}
                          onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                          placeholder="Repetir contrasena"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Nombre de la biblioteca
                      </label>
                      <input
                        type="text"
                        value={profile.biblioteca}
                        onChange={(e) => setProfile({ ...profile, biblioteca: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saving ? "Guardando..." : saved ? "Guardado" : "Guardar cambios"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "biblioteca" && (
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Configuración de Biblioteca</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Catalogación predeterminada
                      </label>
                      <select
                        value={settings.catalogingStandard}
                        onChange={(e) => setSettings({ ...settings, catalogingStandard: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                      >
                        <option>MARC 21</option>
                        <option>UNIMARC</option>
                        <option>Dublin Core</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Clasificación predeterminada
                      </label>
                      <select
                        value={settings.classificationStandard}
                        onChange={(e) => setSettings({ ...settings, classificationStandard: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                      >
                        <option>CDU - Clasificación Decimal Universal</option>
                        <option>LC - Library of Congress</option>
                        <option>DDC - Dewey Decimal Classification</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Registros por página
                      </label>
                      <select 
                        value={settings.itemsPerPage}
                        onChange={(e) => setSettings({ ...settings, itemsPerPage: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                      >
                        <option value="25">25 registros</option>
                        <option value="50">50 registros</option>
                        <option value="100">100 registros</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Identificadores</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900">ISBN</p>
                        <p className="text-xs text-slate-500">International Standard Book Number</p>
                      </div>
                      <input type="checkbox" defaultChecked className="rounded text-slate-900" />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900">ISSN</p>
                        <p className="text-xs text-slate-500">International Standard Serial Number</p>
                      </div>
                      <input type="checkbox" defaultChecked className="rounded text-slate-900" />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Código de barras</p>
                        <p className="text-xs text-slate-500">Generación automática</p>
                      </div>
                      <input type="checkbox" defaultChecked className="rounded text-slate-900" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saving ? "Guardando..." : saved ? "Guardado" : "Guardar cambios"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notificaciones" && (
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Notificaciones</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Notificaciones del sistema</p>
                        <p className="text-xs text-slate-500">Alertas y actualizaciones</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.notificaciones}
                        onChange={(e) => setSettings({ ...settings, notificaciones: e.target.checked })}
                        className="rounded text-slate-900" 
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Notificaciones por email</p>
                        <p className="text-xs text-slate-500">Recibir actualizaciones por correo</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.emailNotifications}
                        onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                        className="rounded text-slate-900" 
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Nuevos registros</p>
                        <p className="text-xs text-slate-500">Notificar cuando se agreguen nuevos libros</p>
                      </div>
                      <input type="checkbox" defaultChecked className="rounded text-slate-900" />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Importaciones completadas</p>
                        <p className="text-xs text-slate-500">Notificar al finalizar importaciones</p>
                      </div>
                      <input type="checkbox" defaultChecked className="rounded text-slate-900" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saving ? "Guardando..." : saved ? "Guardado" : "Guardar cambios"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "avanzado" && (
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Respaldo y Seguridad</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Respaldo automático</p>
                        <p className="text-xs text-slate-500">Crear respaldo diariamente</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.autoBackup}
                        onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                        className="rounded text-slate-900" 
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Exportar datos</p>
                        <p className="text-xs text-slate-500">Descargar todos los datos en JSON</p>
                      </div>
                      <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-100">
                        <Download className="h-4 w-4" />
                        Exportar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 dark:bg-slate-900 dark:border-slate-800">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Zona de Peligro</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
                      <div>
                        <p className="text-sm font-medium text-red-900 dark:text-red-300">Eliminar todos los datos</p>
                        <p className="text-xs text-red-600 dark:text-red-300/90">Esta acción no se puede deshacer</p>
                      </div>
                      <button className="px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/40">
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saving ? "Guardando..." : saved ? "Guardado" : "Guardar cambios"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
