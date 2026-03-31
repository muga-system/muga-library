"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, X, Database, Table, Plus, Loader2, Hand, Library } from "lucide-react"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { useNotifications } from "@/components/notifications-provider"

interface DatabaseItem {
  id: string
  name: string
  description: string | null
}

const FIELD_MAPPING: Record<string, string> = {
  título: "title",
  titulo: "title",
  title: "title",
  "título del libro": "title",
  autor: "author",
  author: "author",
  autores: "author",
  "nombre del autor": "author",
  año: "year",
  anio: "year",
  ano: "year",
  year: "year",
  publicacion: "year",
  fecha: "year",
  "año de publicación": "year",
  "fecha de publicación": "year",
  editorial: "publisher",
  publisher: "publisher",
  editor: "publisher",
  isbn: "isbn",
  "isbn / eisbn": "isbn",
  edición: "edition",
  edicion: "edition",
  edition: "edition",
  lugar: "place",
  place: "place",
  ubicación: "place",
  "lugar de publicación": "place",
  páginas: "pages",
  paginas: "pages",
  pages: "pages",
  "número de páginas": "pages",
  número_de_páginas: "pages",
  num_paginas: "pages",
  pags: "pages",
  cdu: "cdu",
  clasificación: "cdu",
  clasificacion: "cdu",
  class: "cdu",
  "clasificación decimal": "cdu",
  "signatura topográfica": "cdu",
  materia: "subject",
  materias: "subject",
  subject: "subject",
  temas: "subject",
  "palabras clave": "subject",
  keywords: "subject",
  descripción: "description",
  descripcion: "description",
  description: "description",
  nota: "description",
  notas: "description",
  código: "barcode",
  codigo: "barcode",
  barcode: "barcode",
  código_de_barras: "barcode",
  "código de barras": "barcode",
  ejemplares: "total_ejemplares",
  total_ejemplares: "total_ejemplares",
  total: "total_ejemplares",
  copias: "total_ejemplares",
  "cantidad de ejemplares": "total_ejemplares",
  disponibles: "disponibles",
  disp: "disponibles",
  "ejemplares disponibles": "disponibles",
}

export default function ImportarPage() {
  const router = useRouter()
  const notifications = useNotifications()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [databases, setDatabases] = useState<DatabaseItem[]>([])
  const [selectedDb, setSelectedDb] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([])
  const [importMode, setImportMode] = useState<"add" | "update">("add")
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: number; details: string[] } | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [progress, setProgress] = useState({ current: 0, total: 0, percent: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [showNewDbModal, setShowNewDbModal] = useState(false)
  const [newDbName, setNewDbName] = useState("")
  const [newDbDescription, setNewDbDescription] = useState("")
  const [creatingDb, setCreatingDb] = useState(false)

  useEffect(() => {
    if (showNewDbModal) {
      document.body.style.overflow = 'hidden'
      const preventDefault = (e: Event) => e.preventDefault()
      document.addEventListener('wheel', preventDefault, { passive: false })
      return () => {
        document.removeEventListener('wheel', preventDefault)
      }
    } else {
      document.body.style.overflow = ''
    }
  }, [showNewDbModal])

  useEffect(() => {
    loadDatabases()
  }, [])

  async function loadDatabases() {
    try {
      const res = await fetch('/api/databases')
      const data = await res.json()
      setDatabases(data)
    } catch (error) {
      console.error('Error loading databases:', error)
    }
  }

  async function handleCreateDatabase() {
    if (!newDbName.trim()) return
    setCreatingDb(true)
    try {
      const res = await fetch('/api/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDbName.trim(),
          description: newDbDescription.trim() || null
        })
      })
      if (!res.ok) throw new Error('Failed to create')
      
      await loadDatabases()
      const data = await res.json()
      setSelectedDb(data.id || data.id)
      setShowNewDbModal(false)
      setNewDbName("")
      setNewDbDescription("")
    } catch (error) {
      notifications.error("No se pudo crear", "Intenta nuevamente.")
    } finally {
      setCreatingDb(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    processFile(selectedFile)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  function processFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase()
    if (!["csv", "xlsx", "xls"].includes(ext || "")) {
      notifications.warning("Formato no valido", "Selecciona un archivo .csv, .xlsx o .xls")
      return
    }

    setFile(file)
    setResult(null)
    parseFile(file)
  }

  function parseFile(file: File) {
    setLoading(true)
    const ext = file.name.split(".").pop()?.toLowerCase()

    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const normalized = normalizeData(results.data as Record<string, string>[])
          setParsedData(normalized)
          setLoading(false)
          setStep(2)
        },
        error: (error) => {
          notifications.error("Error al leer CSV", error.message)
          setLoading(false)
        }
      })
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer
          const data = new Uint8Array(arrayBuffer)
          const workbook = XLSX.read(data, { type: "array" })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" }) as Record<string, unknown>[]
          
          if (!jsonData || jsonData.length === 0) {
            notifications.warning("Archivo sin datos", "No se encontraron filas para importar.")
            setLoading(false)
            return
          }

          const normalized = normalizeData(jsonData as Record<string, string>[])
          console.log("Parsed data:", normalized)
          setParsedData(normalized)
          setLoading(false)
          setStep(2)
        } catch (error) {
          notifications.error("Error al leer Excel", (error as Error).message)
          setLoading(false)
        }
      }
      reader.onerror = () => {
        notifications.error("Error al leer archivo", "No se pudo procesar el archivo seleccionado.")
        setLoading(false)
      }
      reader.readAsArrayBuffer(file)
    }
  }

  function normalizeData(data: Record<string, unknown>[]): Record<string, string>[] {
    return data.map((row: Record<string, unknown>) => {
      const normalized: Record<string, string> = {}
      Object.keys(row).forEach(key => {
        const value = row[key]
        const keyLower = key.toLowerCase().trim()
        const keyNormalized = keyLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        
        let mappedKey = keyNormalized
        
        if (keyNormalized === 'año' || keyNormalized === 'ano' || keyNormalized.includes('publicacion') || keyNormalized.includes('fecha')) {
          mappedKey = 'year'
        } else if (keyNormalized === 'cdu' || keyNormalized.includes('clasif') || keyNormalized.includes('signatura')) {
          mappedKey = 'cdu'
        } else if (keyNormalized === 'título' || keyNormalized === 'titulo' || keyNormalized.includes('nombre del libro')) {
          mappedKey = 'title'
        } else if (keyNormalized === 'autor' || keyNormalized.includes('autor') || keyNormalized.includes('escritor')) {
          mappedKey = 'author'
        } else if (keyNormalized.includes('editorial') || keyNormalized === 'publisher') {
          mappedKey = 'publisher'
        } else if (keyNormalized.includes('isbn')) {
          mappedKey = 'isbn'
        } else if (keyNormalized.includes('edicion') || keyNormalized === 'edition') {
          mappedKey = 'edition'
        } else if (keyNormalized.includes('lugar') || keyNormalized.includes('ubicacion') || keyNormalized.includes('place')) {
          mappedKey = 'place'
        } else if (keyNormalized.includes('pagina') || keyNormalized.includes('pages') || keyNormalized.includes('pags')) {
          mappedKey = 'pages'
        } else if (keyNormalized.includes('materia') || keyNormalized.includes('tema') || keyNormalized.includes('subject') || keyNormalized.includes('keyword')) {
          mappedKey = 'subject'
        } else if (keyNormalized.includes('descrip') || keyNormalized.includes('nota')) {
          mappedKey = 'description'
        } else if (keyNormalized.includes('codigo') || keyNormalized.includes('barcode')) {
          mappedKey = 'barcode'
        } else if (keyNormalized.includes('ejemplar') || keyNormalized.includes('copia') || keyNormalized === 'total') {
          mappedKey = 'total_ejemplares'
        } else if (keyNormalized.includes('disp')) {
          mappedKey = 'disponibles'
        }
        
        normalized[mappedKey] = value !== undefined && value !== null ? String(value) : ""
      })
      if (!normalized.total_ejemplares) normalized.total_ejemplares = "1"
      if (!normalized.disponibles) normalized.disponibles = "1"
      return normalized
    })
  }

  async function handleImport() {
    if (!selectedDb || parsedData.length === 0) return

    setImporting(true)
    setResult(null)
    setProgress({ current: 0, total: parsedData.length, percent: 0 })

    let successCount = 0
    let errorCount = 0
    const details: string[] = []
    const batchSize = 200

    const validRecords = parsedData
      .map((record, idx) => {
        if (!record.title) {
          errorCount++
          details.push(`Fila ${idx + 2}: Falta título`)
          return null
        }
        
        const missingFields: string[] = []
        if (!record.year) missingFields.push("año")
        if (!record.cdu) missingFields.push("CDU")
        
        if (missingFields.length > 0) {
          details.push(`Fila ${idx + 2}: Advertencia - Falta ${missingFields.join(", ")}`)
        }
        
        return {
          data: {
            title: record.title || "",
            author: record.author || "",
            year: record.year || "",
            publisher: record.publisher || "",
            isbn: record.isbn || "",
            edition: record.edition || "",
            place: record.place || "",
            pages: record.pages || "",
            cdu: record.cdu || "",
            subject: record.subject || "",
            description: record.description || "",
            barcode: record.barcode || "",
          },
          total_ejemplares: parseInt(record.total_ejemplares) || 1,
          disponibles: parseInt(record.disponibles) || 1,
        }
      })
      .filter(Boolean) as Array<{ data: Record<string, unknown>; total_ejemplares: number; disponibles: number }>

    for (let i = 0; i < validRecords.length; i += batchSize) {
      const batch = validRecords.slice(i, i + batchSize)
      
      try {
        const res = await fetch('/api/records', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            database_id: selectedDb,
            records: batch,
          })
        })
        
        if (!res.ok) {
          throw new Error('Batch insert failed')
        }
        
        const data = await res.json()
        successCount += batch.length
      } catch (error) {
        errorCount += batch.length
        details.push(`Error en batch ${Math.floor(i / batchSize) + 1}`)
      }

      const currentProgress = Math.min(i + batchSize, validRecords.length)
      setProgress({
        current: currentProgress,
        total: validRecords.length,
        percent: Math.round((currentProgress / validRecords.length) * 100),
      })
    }

    setResult({ success: successCount, errors: errorCount, details: details.slice(0, 10) })
    setImporting(false)
    setStep(3)
  }

  function resetImport() {
    setFile(null)
    setParsedData([])
    setResult(null)
    setStep(1)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Importar Datos</h1>
              <p className="text-xs text-slate-500">Importar registros desde archivos externos</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>
            1
          </div>
          <div className={`h-0.5 w-12 ${step >= 2 ? "bg-slate-900" : "bg-slate-200"}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>
            2
          </div>
          <div className={`h-0.5 w-12 ${step >= 3 ? "bg-slate-900" : "bg-slate-200"}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 3 ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>
            3
          </div>
          <span className="ml-4 text-sm text-slate-500">
            {step === 1 && "Seleccionar archivo"}
            {step === 2 && "Revisar datos"}
            {step === 3 && "Resultado"}
          </span>
        </div>

        {step === 1 && (
          <>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 mb-6 dark:bg-slate-900 dark:border-slate-700">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                  isDragging 
                    ? "border-slate-500 bg-slate-100" 
                    : "border-slate-300 hover:border-slate-400"
                }`}
              >
                <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Arrastra archivos aquí
                </h3>
                <p className="text-slate-500 mb-4">
                  o haz clic para seleccionar archivos
                </p>
                <p className="text-xs text-slate-400">
                  Formatos: CSV, Excel (.xlsx, .xls) - Máximo 100MB
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 dark:bg-slate-900 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Table className="h-5 w-5" />
                Formatos de Archivo Soportados
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-slate-900">CSV</h4>
                    <p className="text-sm text-slate-500">Archivo de valores separados por comas</p>
                    <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 mt-1 inline-block">.csv</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-slate-900">Excel</h4>
                    <p className="text-sm text-slate-500">Hoja de cálculo de Microsoft Excel</p>
                    <div className="flex gap-1 mt-1">
                      <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">.xlsx</span>
                      <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">.xls</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Datos a Importar
                </h2>
                <span className="text-sm text-slate-500">
                  {parsedData.length} registros encontrados
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      {parsedData[0] && Object.keys(parsedData[0]).map(key => (
                        <th key={key} className="px-3 py-2 text-left text-slate-700 font-medium capitalize">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="border-t border-slate-200">
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="px-3 py-2 text-slate-600 truncate max-w-[150px]">
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 5 && (
                <p className="text-xs text-slate-500 mt-2">
                  ...y {parsedData.length - 5} registros más
                </p>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Database className="h-5 w-5" />
                Opciones de Importación
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Base de Datos Destino *
                  </label>
                  <div className="flex gap-2">
                    <select 
                      value={selectedDb}
                      onChange={(e) => setSelectedDb(e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    >
                      <option value="">Selecciona una base de datos...</option>
                      {databases.map(db => (
                        <option key={db.id} value={db.id}>{db.name}</option>
                      ))}
                    </select>
                    <button 
                      type="button"
                      onClick={() => setShowNewDbModal(true)}
                      className="px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Library className="h-4 w-4" />
                      Nueva
                    </button>
                  </div>
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="mode" 
                      checked={importMode === "add"}
                      onChange={() => setImportMode("add")}
                      className="text-slate-900" 
                    />
                    <span className="text-sm text-slate-700">Agregar registros nuevos</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="mode" 
                      checked={importMode === "update"}
                      onChange={() => setImportMode("update")}
                      className="text-slate-900" 
                    />
                    <span className="text-sm text-slate-700">Actualizar existentes (por ISBN/código)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={resetImport}
                disabled={importing}
                className="flex-1 px-4 py-2.5 text-center text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleImport}
                disabled={!selectedDb || importing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 font-medium"
              >
                {importing ? (
                  <span>Importando {progress.current} de {progress.total} ({progress.percent}%)</span>
                ) : (
                  `Importar ${parsedData.length} Registros`
                )}
              </button>
            </div>

            {importing && (
              <div className="mt-4">
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div 
                    className="bg-slate-900 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Procesando lotes de 200 registros...
                </p>
              </div>
            )}
          </>
        )}

        {step === 3 && result && (
          <>
            <div className={`rounded-xl border p-6 mb-6 ${result.errors === 0 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center gap-4">
                {result.errors === 0 ? (
                  <CheckCircle className="h-12 w-12 text-green-500" />
                ) : (
                  <AlertCircle className="h-12 w-12 text-amber-500" />
                )}
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Importación Completada
                  </h2>
                  <p className="text-slate-600">
                    <span className="text-green-600 font-medium">{result.success} registros</span> importados correctamente
                    {result.errors > 0 && (
                      <span> • <span className="text-amber-600 font-medium">{result.errors} errores</span></span>
                    )}
                  </p>
                </div>
              </div>

              {result.details.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Detalles:</h3>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {result.details.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={resetImport}
                className="flex-1 px-4 py-2.5 text-center text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Importar Más Archivos
              </button>
              <Link 
                href={selectedDb ? `/bases-de-datos/${selectedDb}` : "/bases-de-datos"}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
              >
                Ver Catálogo
              </Link>
            </div>
          </>
        )}
      </main>

      {showNewDbModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                  <Library className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Nueva Base de Datos</h3>
              </div>
              <button onClick={() => setShowNewDbModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={newDbName}
                  onChange={(e) => setNewDbName(e.target.value)}
                  placeholder="Mi Catálogo"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={newDbDescription}
                  onChange={(e) => setNewDbDescription(e.target.value)}
                  placeholder="Descripción opcional..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowNewDbModal(false)}
                className="flex-1 px-4 py-2.5 text-center text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateDatabase}
                disabled={!newDbName.trim() || creatingDb}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 font-medium"
              >
                {creatingDb ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Crear
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
