import fs from "node:fs"
import path from "node:path"

const CP437 = "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσμτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "

function decodeDos(bytes) {
  return Array.from(bytes, (byte) => byte < 0x80 ? String.fromCharCode(byte) : CP437[byte - 0x80] || "�").join("")
}

function pointerToOffset(word, mstLength) {
  const block = (word >>> 11)
  const offset = word & 0x7ff
  const candidates = [(block - 1) * 512 + offset, block * 512 + offset]
  return candidates.find((candidate) => candidate >= 0 && candidate + 18 <= mstLength) ?? -1
}

function parseRecord(mst, offset, expectedMfn) {
  if (offset < 0 || offset + 18 > mst.length) return null
  const mfn = mst.readUInt32LE(offset)
  const mfrl = mst.readUInt16LE(offset + 4)
  const base = mst.readUInt16LE(offset + 12)
  const nvf = mst.readUInt16LE(offset + 14)
  if (mfn !== expectedMfn || mfrl < base || base !== 18 + 6 * nvf || mfrl > mst.length - offset) return null

  const fields = {}
  for (let index = 0; index < nvf; index += 1) {
    const directoryOffset = offset + 18 + index * 6
    const tag = mst.readUInt16LE(directoryOffset)
    const fieldPosition = mst.readUInt16LE(directoryOffset + 2)
    const fieldLength = mst.readUInt16LE(directoryOffset + 4)
    const fieldStart = offset + base + fieldPosition
    if (fieldStart < offset + base || fieldStart + fieldLength > offset + mfrl) continue
    const value = decodeDos(mst.subarray(fieldStart, fieldStart + fieldLength)).replace(/#+$/, "").trim()
    if (!value) continue
    const tagKey = String(tag).padStart(3, "0")
    if (!fields[tagKey]) fields[tagKey] = []
    fields[tagKey].push(value)
  }
  return { mfn, fields }
}

function parseRecords(mst, xrf) {
  const records = []
  for (let xrfBlock = 0; xrfBlock + 512 <= xrf.length; xrfBlock += 512) {
    for (let entry = 1; entry < 128; entry += 1) {
      const xrfOffset = xrfBlock + entry * 4
      if (xrfOffset + 4 > xrf.length) break
      const pointer = xrf.readUInt32LE(xrfOffset)
      if (!pointer) continue
      const mfn = xrfBlock / 512 * 127 + entry
      const parsed = parseRecord(mst, pointerToOffset(pointer, mst.length), mfn)
      if (parsed && parsed.fields["245"]?.length) records.push(parsed)
    }
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

function toBook({ mfn, fields }) {
  const titleField = first(fields, "245")
  const title = [subfield(titleField, "a"), subfield(titleField, "b")].filter(Boolean).join(" : ") || titleField
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
    source_mfn: mfn,
  }
}

function csvValue(value) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`
}

const mstPath = process.argv[2] || "data/import/aguapey/current/MARC.MST"
const xrfPath = process.argv[3] || "data/import/aguapey/current/MARC.XRF"
const output = process.argv[4] || "data/import/aguapey/aguapey-completo.csv"
const parsed = parseRecords(fs.readFileSync(mstPath), fs.readFileSync(xrfPath))
const records = parsed.map(toBook)
const headers = Object.keys(records[0] || { title: "", author: "", year: "", publisher: "", isbn: "", cdu: "" })
const csv = [headers.map(csvValue).join(","), ...records.map((record) => headers.map((header) => csvValue(record[header])).join(","))].join("\n") + "\n"
fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, csv, "utf8")
console.log(JSON.stringify({ mst: mstPath, xrf: xrfPath, output, records: records.length, first: records.slice(0, 3) }, null, 2))
