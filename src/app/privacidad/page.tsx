import Link from "next/link"

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-800 dark:text-slate-200">
      <Link href="/" className="text-sm text-teal-700 hover:underline dark:text-teal-400">← Volver a MUGA</Link>
      <h1 className="mt-8 text-3xl font-semibold">Política de privacidad</h1>
      <p className="mt-3 text-sm text-slate-500">Última actualización: 6 de agosto de 2026</p>
      <div className="mt-8 space-y-6 leading-7">
        <section><h2 className="text-xl font-medium">Qué datos guardamos</h2><p className="mt-2">MUGA guarda los datos necesarios para operar una biblioteca: email de acceso, perfil de la biblioteca, catálogo, registros bibliográficos y movimientos de préstamo. Las imágenes que cargues se almacenan en el espacio de la aplicación.</p></section>
        <section><h2 className="text-xl font-medium">Para qué los usamos</h2><p className="mt-2">Usamos esos datos para autenticar usuarios, administrar catálogos, procesar préstamos, enviar notificaciones operativas y publicar únicamente los catálogos que la biblioteca marque como públicos.</p></section>
        <section><h2 className="text-xl font-medium">Control y conservación</h2><p className="mt-2">Cada biblioteca administra su propio espacio. Las credenciales se almacenan como hashes y las sesiones usan cookies HTTP-only. Podés solicitar correcciones o eliminación escribiendo a <a className="text-teal-700 underline dark:text-teal-400" href="mailto:bibliotecas@muga.dev">bibliotecas@muga.dev</a>.</p></section>
        <section><h2 className="text-xl font-medium">Proveedores</h2><p className="mt-2">El servicio se aloja en Hostinger. Cuando el correo SMTP está configurado, MUGA envía mensajes operativos a través de la cuenta indicada por la persona administradora.</p></section>
      </div>
    </main>
  )
}
