import Link from "next/link"
import { Library, KeyRound, Search, BookOpen, Mail } from "lucide-react"

export default async function PublicLibraryHome() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
              <Library className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">MUGA</h1>
              <p className="text-xs text-slate-500">Sistema de Gestión Bibliotecaria</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/iniciar-sesion" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Gestión Bibliotecaria<span className="text-teal-600">MUGA</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Sistema integral para administrar bibliotecas, catálogos y préstamos
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Login Card */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <KeyRound className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Ya tengo credenciales
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
              Si ya tienes un usuario y contraseña, ingresa al panel de administración de tu biblioteca.
            </p>
            <Link
              href="/iniciar-sesion"
              className="block w-full py-3 text-center bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>

          {/* Activation Card */}
          <div className="bg-teal-50 dark:bg-teal-950/20 rounded-2xl p-8 border border-teal-200 dark:border-teal-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <Library className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-teal-900 dark:text-teal-100">
                Activar mi biblioteca
              </h3>
            </div>
            <p className="text-teal-700 dark:text-teal-300 mb-6 text-sm">
              ¿Tienes un código de activación? Ingrésalo para crear tu biblioteca y comenzar a gestionar tu catálogo.
            </p>
            <Link
              href="/activar"
              className="block w-full py-3 text-center bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              Activar con Cupón
            </Link>
          </div>
        </div>

        {/* Community Section */}
        <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Explora la comunidad
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Descubre catálogos de otras bibliotecas
            </p>
          </div>
          <div className="flex justify-center">
            <Link
              href="/explorar"
              className="inline-flex items-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Search className="h-4 w-4" />
              Explorar Catálogos
            </Link>
          </div>
        </div>

        {/* Request Coupon */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            ¿No tienes un código de activación?
          </p>
          <Link
            href="/solicitar-cupon"
            className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
          >
            <Mail className="h-4 w-4" />
            Solicitar un cupón
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} MUGA - Sistema de Gestión Bibliotecaria
        </div>
      </footer>
    </div>
  )
}
