import Link from "next/link"

export default function TerminosPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-800 dark:text-slate-200">
      <Link href="/" className="text-sm text-teal-700 hover:underline dark:text-teal-400">← Volver a MUGA</Link>
      <h1 className="mt-8 text-3xl font-semibold">Términos de uso</h1>
      <p className="mt-3 text-sm text-slate-500">Última actualización: 6 de agosto de 2026</p>
      <div className="mt-8 space-y-6 leading-7">
        <section><h2 className="text-xl font-medium">Uso responsable</h2><p className="mt-2">La persona administradora es responsable de mantener sus credenciales seguras, cargar información legítima y definir qué parte de su colección desea publicar.</p></section>
        <section><h2 className="text-xl font-medium">Catálogo público</h2><p className="mt-2">Los registros marcados como públicos pueden ser consultados por cualquier visitante. No cargues datos personales de lectores en campos bibliográficos ni en notas públicas.</p></section>
        <section><h2 className="text-xl font-medium">Disponibilidad y soporte</h2><p className="mt-2">MUGA se entrega como herramienta de gestión y no reemplaza los respaldos de la biblioteca. Antes de una operación importante, generá un backup y conservá una copia fuera del servidor. Para soporte: <a className="text-teal-700 underline dark:text-teal-400" href="mailto:bibliotecas@muga.dev">bibliotecas@muga.dev</a>.</p></section>
      </div>
    </main>
  )
}
