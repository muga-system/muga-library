"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search, Tag, Library, Copy, Check } from "lucide-react"

const cduClasses = [
  { code: "0", title: "Obras Generales", description: "Bibliografías, enciclopedias, diccionarios" },
  { code: "1", title: "Filosofía", description: "Lógica, metafísica, ética, psicología" },
  { code: "2", title: "Religión", description: "Teología, Biblia, mitología, religiones" },
  { code: "3", title: "Ciencias Sociales", description: "Sociología, educación, derecho, política" },
  { code: "4", title: "Lenguaje", description: "Lingüística, gramática, diccionarios" },
  { code: "5", title: "Ciencias Puras", description: "Matemáticas, física, química, biología" },
  { code: "6", title: "Ciencias Aplicadas", description: "Medicina, ingeniería, agricultura" },
  { code: "7", title: "Arte y Literatura", description: "Arquitectura, música, literatura, cine" },
  { code: "8", title: "Historia", description: "Historia universal, biografía" },
  { code: "9", title: "Geografía", description: "Geografía, mapas, atlas, viajes" },
]

const cduSubclasses: Record<string, { code: string; title: string; description?: string }[]> = {
  "0": [
    { code: "00", title: "Obras generales" },
    { code: "01", title: "Bibliografía" },
    { code: "02", title: "Biblioteconomía" },
    { code: "03", title: "Enciclopedias generales" },
    { code: "05", title: "Publicaciones periódicas" },
    { code: "06", title: "Colecciones" },
    { code: "07", title: "Periodismo" },
    { code: "08", title: "Publicaciones de asociaciones" },
    { code: "09", title: "Manuscritos y libros raros" },
  ],
  "1": [
    { code: "10", title: "Filosofía" },
    { code: "11", title: "Metafísica" },
    { code: "13", title: "Filosofía de la mente" },
    { code: "14", title: "Sistemas filosóficos" },
    { code: "15", title: "Psicología" },
    { code: "16", title: "Lógica" },
    { code: "17", title: "Ética" },
    { code: "18", title: "Filosofía antigua" },
    { code: "19", title: "Filosofía moderna" },
  ],
  "2": [
    { code: "20", title: "Religión" },
    { code: "21", title: "Religión natural" },
    { code: "22", title: "Biblia" },
    { code: "23", title: "Teología dogmática" },
    { code: "24", title: "Teología moral" },
    { code: "25", title: "Teología pastoral" },
    { code: "26", title: "Iglesia" },
    { code: "27", title: "Historia de la Iglesia" },
    { code: "28", title: "Confesiones y sectas" },
    { code: "29", title: "Mitología" },
  ],
  "3": [
    { code: "30", title: "Ciencias sociales" },
    { code: "31", title: "Estadística" },
    { code: "32", title: "Política" },
    { code: "33", title: "Economía" },
    { code: "34", title: "Derecho" },
    { code: "35", title: "Administración pública" },
    { code: "36", title: "Asistencia social" },
    { code: "37", title: "Educación" },
    { code: "38", title: "Comercio" },
    { code: "39", title: "Costumbres" },
  ],
  "4": [
    { code: "40", title: "Lenguaje" },
    { code: "41", title: "Lingüística" },
    { code: "42", title: "Inglés" },
    { code: "43", title: "Alemán" },
    { code: "44", title: "Francés" },
    { code: "45", title: "Italiano" },
    { code: "46", title: "Español" },
    { code: "47", title: "Portugués" },
    { code: "48", title: "Lenguas latinas" },
    { code: "49", title: "Lenguas griega y otras" },
  ],
  "5": [
    { code: "50", title: "Ciencias puras" },
    { code: "51", title: "Matemáticas" },
    { code: "52", title: "Astronomía" },
    { code: "53", title: "Física" },
    { code: "54", title: "Química" },
    { code: "55", title: "Geología" },
    { code: "56", title: "Paleontología" },
    { code: "57", title: "Biología" },
    { code: "58", title: "Botánica" },
    { code: "59", title: "Zoología" },
  ],
  "6": [
    { code: "60", title: "Ciencias aplicadas" },
    { code: "61", title: "Medicina" },
    { code: "62", title: "Ingeniería" },
    { code: "63", title: "Agricultura" },
    { code: "64", title: "Economía doméstica" },
    { code: "65", title: "Gestión empresarial" },
    { code: "66", title: "Química industrial" },
    { code: "67", title: "Industrias" },
    { code: "68", title: "Manufacturas" },
    { code: "69", title: "Construcción" },
  ],
  "7": [
    { code: "70", title: "Arte y literatura" },
    { code: "71", title: "Urbanismo" },
    { code: "72", title: "Arquitectura" },
    { code: "73", title: "Escultura" },
    { code: "74", title: "Dibujo y diseño" },
    { code: "75", title: "Pintura" },
    { code: "76", title: "Grabado" },
    { code: "77", title: "Fotografía" },
    { code: "78", title: "Música" },
    { code: "79", title: "Entretenimiento" },
  ],
  "8": [
    { code: "80", title: "Literatura" },
    { code: "81", title: "Lingüística literaria" },
    { code: "82", title: "Literatura inglesa" },
    { code: "83", title: "Literatura alemana" },
    { code: "84", title: "Literatura francesa" },
    { code: "85", title: "Literatura italiana" },
    { code: "86", title: "Literatura española y portuguesa" },
    { code: "87", title: "Literatura latina" },
    { code: "88", title: "Literatura griega" },
    { code: "89", title: "Otras literaturas" },
  ],
  "9": [
    { code: "90", title: "Historia" },
    { code: "91", title: "Geografía" },
    { code: "92", title: "Biografía" },
    { code: "93", title: "Historia antigua" },
    { code: "94", title: "Historia de Europa" },
    { code: "95", title: "Historia de Asia" },
    { code: "96", title: "Historia de África" },
    { code: "97", title: "Historia de Norteamérica" },
    { code: "98", title: "Historia de Sudamérica" },
    { code: "99", title: "Historia de Oceanía" },
  ],
}

export default function CDUSearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const filteredClasses = cduClasses.filter(cls => 
    cls.code.includes(searchQuery) ||
    cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSubclasses = Object.fromEntries(
    Object.entries(cduSubclasses).map(([code, subs]) => [
      code,
      subs.filter(sub => 
        sub.code.includes(searchQuery) ||
        sub.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    ]).filter(([_, subs]) => subs.length > 0)
  )

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 1500)
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-slate-500" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                  <Tag className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-slate-900">Clasificación Decimal Universal</h1>
                  <p className="text-xs text-slate-500">Referencia y selección de códigos</p>
                </div>
              </div>
            </div>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar código o tema..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Library className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h2 className="font-medium text-slate-900 mb-1">Sistema de Clasificación Decimal Universal</h2>
              <p className="text-sm text-slate-500">
                La CDU organiza el conocimiento en 10 clases principales (0-9), subdivididas en niveles más específicos. 
                Cada código representa un área del conocimiento para clasificar materiales bibliográficos.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-medium text-slate-900 mb-4">10 Clases Principales</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {filteredClasses.map((cls) => (
              <button
                key={cls.code}
                onClick={() => copyToClipboard(cls.code)}
                className="bg-white rounded-lg border border-slate-200 p-4 text-left hover:border-slate-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl font-bold text-slate-900">{cls.code}</span>
                  {copiedCode === cls.code ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-300 group-hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <p className="text-sm font-medium text-slate-700 line-clamp-2">{cls.title}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(cduSubclasses).map(([code, subs]) => {
            if (filteredSubclasses[code]?.length === 0) return null
            
            return (
              <div key={code} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center text-white font-bold text-sm">
                      {code}
                    </span>
                    <span className="font-medium text-slate-900">
                      {cduClasses.find(c => c.code === code)?.title}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {(filteredSubclasses[code] || subs).map((sub: { code: string; title: string }) => (
                      <button
                        key={sub.code}
                        onClick={() => copyToClipboard(sub.code)}
                        className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors group text-left"
                      >
                        <span className="font-mono text-sm text-slate-600">{sub.code}</span>
                        <span className="text-sm text-slate-700 truncate flex-1 ml-2">{sub.title}</span>
                        {copiedCode === sub.code ? (
                          <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                        ) : (
                          <Copy className="h-3 w-3 text-slate-300 group-hover:text-slate-500 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 bg-slate-100 rounded-xl p-6">
          <h3 className="font-medium text-slate-900 mb-4">Referencia Rápida</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-slate-500 font-mono">0</span>
              <p className="text-slate-700">Obras Generales</p>
            </div>
            <div>
              <span className="text-slate-500 font-mono">1</span>
              <p className="text-slate-700">Filosofía</p>
            </div>
            <div>
              <span className="text-slate-500 font-mono">2</span>
              <p className="text-slate-700">Religión</p>
            </div>
            <div>
              <span className="text-slate-500 font-mono">3</span>
              <p className="text-slate-700">Ciencias Sociales</p>
            </div>
            <div>
              <span className="text-slate-500 font-mono">4</span>
              <p className="text-slate-700">Lenguaje</p>
            </div>
            <div>
              <span className="text-slate-500 font-mono">5</span>
              <p className="text-slate-700">Ciencias Puras</p>
            </div>
            <div>
              <span className="text-slate-500 font-mono">6</span>
              <p className="text-slate-700">Ciencias Aplicadas</p>
            </div>
            <div>
              <span className="text-slate-500 font-mono">7</span>
              <p className="text-slate-700">Arte y Literatura</p>
            </div>
            <div>
              <span className="text-slate-500 font-mono">8</span>
              <p className="text-slate-700">Historia</p>
            </div>
            <div>
              <span className="text-slate-500 font-mono">9</span>
              <p className="text-slate-700">Geografía</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Haz click en cualquier código para copiarlo al portapapeles. 
            Luego puedes usarlo al agregar nuevos registros.
          </p>
        </div>

      </main>
    </div>
  )
}
