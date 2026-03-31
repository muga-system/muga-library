import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, BookOpen, User, Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { getLoanById } from "@/lib/services/database"
import { DevolverButton } from "./devolver-button"

export default async function DetallePrestamoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const prestamo = await getLoanById(id)
  
  if (!prestamo) {
    notFound()
  }

  const estaVencido = (prestamo.status === "active" || prestamo.status === "overdue") &&
    new Date(prestamo.dueDate) < new Date()

  const effectiveStatus = estaVencido ? "overdue" : prestamo.status

  const statusConfig = effectiveStatus === "requested"
    ? {
        container: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50",
        icon: <Clock className="h-6 w-6 text-amber-600" />,
        titleClass: "text-amber-700",
        title: "Solicitud Pendiente",
        detail: "Esperando aprobación del equipo bibliotecario.",
      }
    : effectiveStatus === "rejected"
      ? {
          container: "bg-slate-100 border-slate-300 dark:bg-slate-900 dark:border-slate-700",
          icon: <AlertTriangle className="h-6 w-6 text-slate-600 dark:text-slate-200" />,
          titleClass: "text-slate-700 dark:text-slate-200",
          title: "Solicitud Rechazada",
          detail: prestamo.rejectionReason ? `Motivo: ${prestamo.rejectionReason}` : "La solicitud fue rechazada.",
        }
      : effectiveStatus === "returned"
        ? {
            container: "bg-green-50 border-green-200 dark:bg-emerald-950/20 dark:border-emerald-900/50",
            icon: <CheckCircle className="h-6 w-6 text-green-600" />,
            titleClass: "text-green-700",
            title: "Préstamo Devuelto",
            detail: null,
          }
        : effectiveStatus === "overdue"
          ? {
              container: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50",
              icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
              titleClass: "text-red-700",
              title: "Préstamo Vencido",
              detail: `Han pasado ${Math.floor((new Date().getTime() - new Date(prestamo.dueDate).getTime()) / (1000 * 60 * 60 * 24))} días desde el vencimiento`,
            }
          : {
              container: "bg-blue-50 border-blue-200 dark:bg-slate-900 dark:border-slate-700",
              icon: <Clock className="h-6 w-6 text-blue-600" />,
              titleClass: "text-blue-700",
              title: "Préstamo Activo",
              detail: null,
            }

  const recordData = prestamo.record?.data as Record<string, unknown> | undefined

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/prestamos" className="rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                <ArrowLeft className="h-5 w-5 text-slate-500" />
              </Link>
              <div>
                <h1 className="font-semibold text-slate-900 dark:text-slate-100">Detalle del Préstamo</h1>
                <p className="text-xs text-slate-500">Información del préstamo</p>
              </div>
            </div>
            {(prestamo.status === "active" || prestamo.status === "overdue") && (
              <DevolverButton prestamoId={prestamo.id} />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Estado */}
        <div className={`mb-6 rounded-xl border p-4 ${statusConfig.container}`}>
          <div className="flex items-center gap-3">
            {statusConfig.icon}
            <div>
              <div className={`font-semibold ${statusConfig.titleClass}`}>{statusConfig.title}</div>
              {statusConfig.detail ? <div className="text-sm text-slate-600 dark:text-slate-300">{statusConfig.detail}</div> : null}
            </div>
          </div>
        </div>

        {/* Libro */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Libro
          </h3>
          <div className="text-lg font-semibold text-slate-900">
            {(recordData?.title as string) || "Sin título"}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            {(recordData?.author as string) || "—"}
          </div>
        </div>

        {/* Prestatario */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
            <User className="h-4 w-4" />
            Prestatario
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-slate-500">Nombre</span>
              <div className="text-slate-900">{prestamo.borrowerName}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500">Tipo</span>
                <div className="text-slate-900 capitalize">{prestamo.borrowerType === "student" ? "Alumno" : "Profesor"}</div>
              </div>
              {prestamo.borrowerType === "student" ? (
                <div>
                  <span className="text-xs text-slate-500">Curso</span>
                  <div className="text-slate-900">{prestamo.borrowerCourse}° "{prestamo.borrowerDivision}"</div>
                </div>
              ) : (
                <div>
                  <span className="text-xs text-slate-500">Departamento</span>
                  <div className="text-slate-900">{prestamo.borrowerDepartment || "—"}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fechas */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Fechas
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-slate-500">Fecha de Préstamo</span>
              <div className="text-slate-900">
                {new Date(prestamo.loanDate).toLocaleDateString("es-ES", { 
                  weekday: "long", year: "numeric", month: "long", day: "numeric" 
                })}
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-500">Fecha de Vencimiento</span>
              <div className={estaVencido ? "text-red-600 font-medium" : "text-slate-900"}>
                {new Date(prestamo.dueDate).toLocaleDateString("es-ES", { 
                  weekday: "long", year: "numeric", month: "long", day: "numeric" 
                })}
              </div>
            </div>
            {prestamo.returnDate && (
              <div className="col-span-2">
                <span className="text-xs text-slate-500">Fecha de Devolución</span>
                <div className="text-green-600 font-medium">
                  {new Date(prestamo.returnDate).toLocaleDateString("es-ES", { 
                    weekday: "long", year: "numeric", month: "long", day: "numeric" 
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Observaciones */}
        {prestamo.notes && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-medium text-slate-900 mb-2">Observaciones</h3>
            <p className="text-slate-700">{prestamo.notes}</p>
          </div>
        )}
      </main>
    </div>
  )
}

