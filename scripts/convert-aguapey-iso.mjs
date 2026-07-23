import fs from "node:fs"
import path from "node:path"

const CP437 = "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσμτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "

function decodeDos(bytes) {
  return Array.from(bytes, (byte) => byte < 0x80 ? String.fromCharCode(byte) : CP437[byte - 0x80] || "�").join("")
}

function parseRecords(filePath) {
  const raw = fs.readFileSync(filePath)
  const flat = Buffer.from(raw.toString("latin1").replaceAll("\r\n", ""), "latin1")
  const records = []
  let position = 0

  while (position + 5 <= flat.length) {
    const length = Number(flat.subarray(position, position + 5).toString("ascii"))
    if (!Number.isFinite(length) || length < 25 || position + length > flat.length) break

    const record = flat.subarray(position, position + length)
    const baseAddress = Number(record.subarray(12, 17).toString("ascii"))
    const fields = {}

    for (let directoryPosition = 24; directoryPosition + 12 <= baseAddress; directoryPosition += 12) {
      const entry = record.subarray(directoryPosition, directoryPosition + 12).toString("ascii")
      if (entry[0] === "#") break
      const tag = entry.slice(0, 3)
      const fieldLength = Number(entry.slice(3, 7))
      const fieldStart = Number(entry.slice(7, 12))
      if (!/^\d{3}$/.test(tag) || !Number.isFinite(fieldLength) || !Number.isFinite(fieldStart)) continue

      const field = decodeDos(record.subarray(baseAddress + fieldStart, baseAddress + fieldStart + fieldLength))
        .replace(/#+$/, "")
        .trim()
      if (!fields[tag]) fields[tag] = []
      fields[tag].push(field)
    }

    records.push(fields)
    position += length
  }

  return records
}

function subfield(field, code) {
  const match = field.match(new RegExp(`\\^${code}([^\\^#]*)`, "i"))
  return match?.[1]?.trim() || ""
}

function first(fields, tag, code) {
  return (fields[tag] || []).map((field) => code ? subfield(field, code) : field).find(Boolean) || ""
}

function all(fields, tag, code) {
  return (fields[tag] || []).flatMap((field) => code ? [subfield(field, code)].filter(Boolean) : [field]).filter(Boolean)
}

function csvValue(value) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`
}

function toBook(fields) {
  const titleField = first(fields, "245")
  const title = [subfield(titleField, "a"), subfield(titleField, "b")].filter(Boolean).join(" : ")
  const author = [first(fields, "100", "a"), first(fields, "110", "a"), first(fields, "111", "a")].find(Boolean) || ""
  const publication = first(fields, "260") || first(fields, "264")
  const year = (subfield(publication, "c").match(/\d{4}/) || [""])[0]
  const publisher = subfield(publication, "b")
  const place = subfield(publication, "a")
  const subject = [...all(fields, "650", "a"), ...all(fields, "653", "a")].join("; ")
  const description = [...all(fields, "500", "a"), ...all(fields, "520", "a")].join("\n")

  return {
    title,
    author,
    year,
    publisher,
    isbn: subfield(first(fields, "020"), "a"),
    edition: subfield(first(fields, "250"), "a"),
    place,
    pages: subfield(first(fields, "300"), "a"),
    cdu: first(fields, "080", "a"),
    subject,
    description,
    barcode: first(fields, "609", "a"),
    total_ejemplares: 1,
    disponibles: 1,
  }
}

const input = process.argv[2] || "data/import/aguapey/MARC.ISO"
const output = process.argv[3] || "data/import/aguapey/aguapey-piloto.csv"
const limit = Number(process.argv[4] || 50)
const records = parseRecords(input).slice(0, limit).map(toBook)
const headers = Object.keys(records[0] || { title: "", author: "", year: "", publisher: "", isbn: "", cdu: "" })
const csv = [headers.map(csvValue).join(","), ...records.map((record) => headers.map((header) => csvValue(record[header])).join(","))].join("\n") + "\n"
fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, csv, "utf8")
console.log(JSON.stringify({ input, output, records: records.length, totalAvailable: parseRecords(input).length }))
