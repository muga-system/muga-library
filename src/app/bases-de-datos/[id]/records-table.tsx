"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, MoreVertical, ChevronLeft, ChevronRight, Check, X, Edit3, CheckSquare, Square, Plus } from "lucide-react"
import { useNotifications } from "@/components/notifications-provider"
import { useConfirm } from "@/components/confirm-provider"

interface BookRecord {
  id: string
  mfn: number
  database_id?: string
  data: Record<string, unknown>
}

interface Props {
  records: BookRecord[]
  databaseId: string
  databaseName?: string
  total: number
  currentPage: number
  pageSize: number
}

function toSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function RecordsTable({ records, databaseId, databaseName, total, currentPage, pageSize }: Props) {
  const router = useRouter()
  const notifications = useNotifications()
  const { confirm } = useConfirm()
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const totalPages = Math.ceil(total / pageSize)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ year: "", cdu: "" })
  const [saving, setSaving] = useState(false)
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBatchEdit, setShowBatchEdit] = useState(false)
  const [batchForm, setBatchForm] = useState({ year: "", cdu: "" })
  const [batchSaving, setBatchSaving] = useState(false)

  function goToPage(page: number) {
    if (page < 1 || page > totalPages) return
    const params = new URLSearchParams()
    params.set('page', String(page))
    router.push(`/bases-de-datos/${databaseId}?${params.toString()}`)
  }

  function startQuickEdit(record: BookRecord) {
    setEditingId(record.id)
    setEditForm({
      year: String(record.data?.year || ""),
      cdu: String(record.data?.cdu || ""),
    })
  }

  async function saveQuickEdit(recordId: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/records/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { year: editForm.year, cdu: editForm.cdu }
        })
      })
      if (!res.ok) throw new Error('Failed to update')
      router.refresh()
    } catch (error) {
      notifications.error("No se pudo guardar", "Intenta nuevamente.")
    } finally {
      setSaving(false)
      setEditingId(null)
    }
  }

  function cancelQuickEdit() {
    setEditingId(null)
    setEditForm({ year: "", cdu: "" })
  }

  function toggleSelection(id: string) {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  function toggleAll() {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(records.map(r => r.id)))
    }
  }

  async function saveBatchEdit() {
    if (selectedIds.size === 0) return
    setBatchSaving(true)
    try {
      const updates = Array.from(selectedIds).map(id => ({
        id,
        data: { year: batchForm.year || undefined, cdu: batchForm.cdu || undefined }
      }))
      
      await Promise.all(updates.map(update => 
        fetch(`/api/records/${update.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        })
      ))
      
      router.refresh()
      setSelectedIds(new Set())
      setShowBatchEdit(false)
      setBatchForm({ year: "", cdu: "" })
    } catch (error) {
      notifications.error("No se pudo guardar", "Intenta nuevamente.")
    } finally {
      setBatchSaving(false)
    }
  }

  useEffect(() => {
    if (!menuOpen) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-row-menu-root="true"]')) return
      setMenuOpen(null)
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [menuOpen])
  
  const slug = databaseName ? toSlug(databaseName) : databaseId

  async function handleDelete(recordId: string, title: string) {
    const ok = await confirm({
      title: "Eliminar registro",
      description: `Se eliminara "${title || "sin titulo"}" de forma permanente.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      tone: "danger",
    })
    if (!ok) {
      return
    }

    try {
      const res = await fetch(`/api/records/${recordId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      router.refresh()
    } catch (error) {
      notifications.error("No se pudo eliminar", "Intenta nuevamente.")
    }
    setMenuOpen(null)
  }

  return (
    <div className="relative overflow-visible bg-slate-50 rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white rounded-t-xl">
          <span className="text-sm">{selectedIds.size} registro(s) seleccionado(s)</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowBatchEdit(true)}
              className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg"
            >
              Editar Año/CDU
            </button>
            <button 
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {showBatchEdit && (
        <div className="flex items-center gap-4 px-4 py-3 bg-amber-50 border-b border-amber-200">
          <span className="text-sm font-medium text-amber-800">Editar {selectedIds.size} registro(s):</span>
          <input
            type="text"
            value={batchForm.year}
            onChange={(e) => setBatchForm({ ...batchForm, year: e.target.value })}
            placeholder="Año (opcional)"
            className="px-2 py-1 text-sm border border-amber-300 rounded w-24"
          />
          <input
            type="text"
            value={batchForm.cdu}
            onChange={(e) => setBatchForm({ ...batchForm, cdu: e.target.value })}
            placeholder="CDU (opcional)"
            className="px-2 py-1 text-sm border border-amber-300 rounded w-24"
          />
          <button 
            onClick={saveBatchEdit}
            disabled={batchSaving}
            className="px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50"
          >
            {batchSaving ? "Guardando..." : "Aplicar"}
          </button>
          <button 
            onClick={() => setShowBatchEdit(false)}
            className="px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-100 rounded-lg"
          >
            Cancelar
          </button>
        </div>
      )}

      <table className="w-full">
        <thead className="bg-slate-100 border-b border-slate-200 dark:border-white/20">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase w-8">
              <button onClick={toggleAll} className="text-slate-500 hover:text-slate-700">
                {selectedIds.size === records.length && records.length > 0 ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">MFN</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Título</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Autor</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Año</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">CDU</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-white/20">
          {records.map((record) => (
            <tr key={record.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/70 group">
              <td className="px-4 py-3">
                <button onClick={() => toggleSelection(record.id)} className="text-slate-500 hover:text-slate-700">
                  {selectedIds.has(record.id) ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </td>
              <td className="px-4 py-3 text-sm text-slate-500 font-mono">{record.mfn || '—'}</td>
              <td className="px-4 py-3">
                <Link href={`/bases-de-datos/${slug}/registros/${record.id}`} className="text-sm font-medium text-slate-900 hover:text-slate-600">
                  {(record.data?.title as string) || "Sin título"}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{(record.data?.author as string) || "—"}</td>
              <td className="px-4 py-3">
                {editingId === record.id ? (
                  <input
                    type="text"
                    value={editForm.year}
                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                    placeholder="Año"
                    className="w-20 px-2 py-1 text-sm border border-slate-300 rounded"
                  />
                ) : (
                  <div 
                    onClick={() => startQuickEdit(record)}
                    title="Editar"
                    className="cursor-pointer hover:bg-slate-200 px-2 py-1 -mx-2 rounded"
                  >
                    <span className="text-sm text-slate-500">{(record.data?.year as string) || "—"}</span>
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                {editingId === record.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editForm.cdu}
                      onChange={(e) => setEditForm({ ...editForm, cdu: e.target.value })}
                      placeholder="CDU"
                      className="w-24 px-2 py-1 text-sm border border-slate-300 rounded"
                    />
                    <button 
                      onClick={() => saveQuickEdit(record.id)}
                      disabled={saving}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={cancelQuickEdit}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : record.data?.cdu ? (
                  <div 
                    onClick={() => startQuickEdit(record)}
                    title="Editar"
                    className="cursor-pointer hover:bg-slate-200 px-2 py-1 -mx-2 rounded"
                  >
                    <span className="text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                      {String(record.data.cdu)}
                    </span>
                  </div>
                ) : (
                  <div 
                    onClick={() => startQuickEdit(record)}
                    title="Editar"
                    className="cursor-pointer hover:bg-slate-200 px-2 py-1 -mx-2 rounded"
                  >
                    <span className="inline-flex items-center justify-center min-w-[48px] h-5 rounded border border-dashed border-teal-500">
                      <Plus className="h-3 w-3 text-teal-600" />
                    </span>
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-right overflow-visible">
                <div className="relative" data-row-menu-root="true">
                  <button
                    onClick={() => setMenuOpen(menuOpen === record.id ? null : record.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      menuOpen === record.id
                        ? "bg-slate-300 text-slate-700 dark:bg-slate-600/80 dark:text-slate-100"
                        : "text-slate-500 hover:bg-slate-300 dark:text-slate-300 dark:hover:bg-slate-600/70"
                    }`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {menuOpen === record.id && (
                    <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-slate-200 bg-white shadow-lg z-[1300] dark:border-slate-700 dark:bg-slate-900">
                      <Link
                        href={`/bases-de-datos/${slug}/registros/${record.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Pencil className="h-4 w-4" />
                        Ver
                      </Link>
                      <Link
                        href={`/bases-de-datos/${slug}/registros/${record.id}/editar`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(record.id, String(record.data?.title || ""))}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {total > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <div className="text-sm text-slate-500">
            Mostrando <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-medium">{Math.min(currentPage * pageSize, total)}</span> de <span className="font-medium">{total}</span> registros
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-slate-600">
              Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
