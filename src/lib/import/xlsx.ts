import { unzipSync } from "fflate"

function xml(zip: Record<string, Uint8Array>, path: string) {
  const content = zip[path]
  if (!content) throw new Error(`Missing XLSX part: ${path}`)
  return new DOMParser().parseFromString(new TextDecoder().decode(content), "application/xml")
}

function elements(document: Document | Element, name: string) {
  return Array.from(document.getElementsByTagNameNS("*", name))
}

function columnIndex(reference: string) {
  const letters = reference.match(/^[A-Z]+/i)?.[0].toUpperCase() || "A"
  return [...letters].reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1
}

function cellValue(cell: Element, sharedStrings: string[]) {
  const type = cell.getAttribute("t")
  const value = elements(cell.ownerDocument, "v").find((item) => item.parentElement === cell)?.textContent || ""
  if (type === "s") return sharedStrings[Number(value)] || ""
  if (type === "inlineStr") return elements(cell.ownerDocument, "t").filter((item) => cell.contains(item)).map((item) => item.textContent || "").join("")
  if (type === "b") return value === "1" ? "TRUE" : "FALSE"
  return value
}

export async function parseXlsx(arrayBuffer: ArrayBuffer): Promise<Record<string, unknown>[]> {
  const zip = unzipSync(new Uint8Array(arrayBuffer))
  const workbook = xml(zip, "xl/workbook.xml")
  const relationships = xml(zip, "xl/_rels/workbook.xml.rels")
  const firstSheet = elements(workbook, "sheet")[0]
  if (!firstSheet) throw new Error("El archivo XLSX no contiene hojas")

  const relationshipId = firstSheet.getAttribute("r:id")
  const relationship = elements(relationships, "Relationship").find((item) => item.getAttribute("Id") === relationshipId)
  const target = relationship?.getAttribute("Target") || "worksheets/sheet1.xml"
  const sheetPath = target.startsWith("/") ? target.slice(1) : target.startsWith("xl/") ? target : `xl/${target}`
  const sharedStrings = zip["xl/sharedStrings.xml"]
    ? elements(xml(zip, "xl/sharedStrings.xml"), "si").map((item) => elements(item.ownerDocument, "t").filter((text) => item.contains(text)).map((text) => text.textContent || "").join(""))
    : []
  const sheet = xml(zip, sheetPath)
  const rows = elements(sheet, "row")
  if (!rows.length) return []

  const headers = new Map<number, string>()
  for (const cell of elements(rows[0], "c")) {
    const reference = cell.getAttribute("r") || "A1"
    headers.set(columnIndex(reference), String(cellValue(cell, sharedStrings)).trim() || `Campo ${headers.size + 1}`)
  }

  return rows.slice(1).map((row) => {
    const record: Record<string, unknown> = {}
    for (const cell of elements(row, "c")) {
      const reference = cell.getAttribute("r") || "A1"
      const header = headers.get(columnIndex(reference))
      if (header) record[header] = cellValue(cell, sharedStrings)
    }
    return record
  }).filter((record) => Object.values(record).some((value) => String(value).trim()))
}
