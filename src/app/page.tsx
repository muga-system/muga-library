import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleUserRound,
  FileUp,
  Library,
  Search,
  Users,
} from "lucide-react"
import { MugaHeader } from "@/components/muga-header"
import { HomeAccountActions } from "@/components/home-account-actions"
import { getCurrentUser } from "@/lib/auth/service"

const capabilities = [
  {
    icon: BookOpen,
    title: "Catálogos y registros",
    description: "Organizá colecciones, ejemplares y datos bibliográficos desde un mismo espacio.",
  },
  {
    icon: FileUp,
    title: "Importación de datos",
    description: "Incorporá catálogos existentes desde planillas y formatos bibliotecarios.",
  },
  {
    icon: CircleUserRound,
    title: "Préstamos y usuarios",
    description: "Gestioná solicitudes, entregas, devoluciones y disponibilidad de ejemplares.",
  },
]

const incorporationSteps = [
  ["1", "Solicitá acceso", "Contanos qué biblioteca querés incorporar."],
  ["2", "Activá la biblioteca", "Recibirás un código para crear su espacio."],
  ["3", "Configurá y cargá", "Importá el catálogo y definí qué querés publicar."],
]

const libraryFlow = [
  {
    number: "01",
    icon: Library,
    title: "Ordená la colección",
    description: "Catálogos, registros y ejemplares con una estructura clara.",
  },
  {
    number: "02",
    icon: CircleUserRound,
    title: "Gestioná el día a día",
    description: "Personas, préstamos, solicitudes y devoluciones en un mismo lugar.",
  },
  {
    number: "03",
    icon: Users,
    title: "Compartí con criterio",
    description: "Cada biblioteca decide qué parte de su catálogo abre a la comunidad.",
  },
]

export default async function PublicLibraryHome() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <MugaHeader
        navigation={
          <>
            <Link href="#funciones" className="hover:text-slate-900 dark:hover:text-slate-200">Funciones</Link>
            <Link href="#como-usar" className="hover:text-slate-900 dark:hover:text-slate-200">Cómo usarlo</Link>
            <Link href="/catalogo" className="hover:text-slate-900 dark:hover:text-slate-200">Catálogo público</Link>
          </>
        }
        actions={
          <HomeAccountActions initialUser={user} />
        }
      />

      <main className="mx-auto max-w-6xl px-6 py-14 md:py-16">
        <section className="mb-24">
          <div className="max-w-4xl pt-2 md:pt-6">
            <p className="mb-4 text-sm font-medium text-teal-700 dark:text-teal-400">Gestión bibliotecaria compartida</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl lg:text-[3.5rem]">
              Una biblioteca viva necesita algo más que un catálogo.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
              MUGA organiza todo lo que sucede alrededor de una colección: registros, personas, préstamos y decisiones de publicación. Cada biblioteca administra su espacio; la comunidad descubre lo que decide compartir.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/catalogo" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
                <Search className="h-4 w-4" />
                Explorar catálogos
              </Link>
              <Link href="/solicitar-cupon" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                Incorporar mi biblioteca
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            <div className="grid md:grid-cols-3">
              {libraryFlow.map(({ number, icon: Icon, title, description }, index) => (
                <div key={number} className={`p-6 md:p-7 ${index > 0 ? "border-t border-slate-200 dark:border-slate-800 md:border-l md:border-t-0" : ""}`}>
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-800">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-medium text-slate-400">{number}</span>
                  </div>
                  <h2 className="font-medium text-slate-900 dark:text-slate-100">{title}</h2>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="funciones" className="mb-20">
          <div className="mb-7">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Qué podés hacer</h2>
            <p className="mt-1 text-sm text-slate-500">Las herramientas principales para trabajar con una biblioteca.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-medium text-slate-900 dark:text-slate-100">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="como-usar" className="mb-20">
          <div className="mb-7">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Cómo usar el sitio</h2>
            <p className="mt-1 text-sm text-slate-500">Elegí el recorrido que corresponde a lo que necesitás hacer.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900"><Search className="h-5 w-5 text-white" /></div>
                <span className="rounded-md bg-slate-200 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">Acceso abierto</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Quiero encontrar un libro</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">Buscá por título, autor o ISBN en los catálogos que las bibliotecas decidieron publicar. No necesitás iniciar sesión.</p>
              <Link href="/catalogo" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Ir al catálogo <ArrowRight className="h-4 w-4" /></Link>
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900"><Users className="h-5 w-5 text-white" /></div>
                <span className="rounded-md bg-slate-200 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">Equipo bibliotecario</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Quiero gestionar una biblioteca</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">Ingresá con la cuenta vinculada a tu biblioteca para administrar sus catálogos, préstamos y preferencias.</p>
              <Link href="/iniciar-sesion" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Entrar al panel <ArrowRight className="h-4 w-4" /></Link>
            </article>
          </div>
        </section>

        <section className="mb-20 rounded-xl border border-slate-200 bg-slate-50 p-7 dark:border-slate-800 dark:bg-slate-900 md:p-9">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-md">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Incorporar una biblioteca</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                El código de activación es una invitación para crear el espacio de trabajo. No es un cupón de compra ni un medio de pago.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/solicitar-cupon" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">Solicitar incorporación <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/activar" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-950">Ya tengo un código</Link>
              </div>
            </div>
            <div className="grid flex-1 gap-3 md:grid-cols-3 lg:max-w-2xl">
              {incorporationSteps.map(([number, title, description]) => (
                <div key={number} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                  <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-medium text-white">{number}</div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-5 border-t border-slate-200 pt-8 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100"><CheckCircle2 className="h-4 w-4 text-teal-600" /> Un proyecto abierto y comunitario</div>
            <p className="text-sm leading-6 text-slate-500">Cada biblioteca conserva el control de sus datos. La comunidad accede únicamente a los catálogos que sus responsables deciden publicar.</p>
          </div>
          <Link href="/catalogo" className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Conocer los catálogos <ArrowRight className="h-4 w-4" /></Link>
        </section>
      </main>
    </div>
  )
}
