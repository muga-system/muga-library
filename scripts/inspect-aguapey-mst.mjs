import fs from "node:fs"

const mstPath = process.argv[2] || "data/import/aguapey/current/MARC.MST"
const xrfPath = process.argv[3] || "data/import/aguapey/current/MARC.XRF"
const mst = fs.readFileSync(mstPath)
const xrf = fs.readFileSync(xrfPath)

function pointerCandidates(word) {
  const value = word >>> 0
  const block = value >>> 11
  const offset = value & 0x7ff
  return [
    (block - 1) * 512 + offset,
    block * 512 + offset,
  ].filter((candidate) => candidate >= 0 && candidate + 18 <= mst.length)
}

function readHeader(offset) {
  return {
    offset,
    mfn: mst.readUInt32LE(offset),
    mfrl16: mst.readUInt16LE(offset + 4),
    mfbwb: mst.readUInt32LE(offset + 6),
    mfbwp16: mst.readUInt16LE(offset + 10),
    base: mst.readUInt16LE(offset + 12),
    nvf: mst.readUInt16LE(offset + 14),
    status: mst.readUInt16LE(offset + 16),
    mfrl32: mst.readUInt32LE(offset + 4),
  }
}

let shown = 0
for (let xrfBlock = 0; xrfBlock + 512 <= xrf.length && shown < 80; xrfBlock += 512) {
  for (let entry = 1; entry < 128 && xrfBlock + entry * 4 + 4 <= xrf.length && shown < 80; entry += 1) {
    const word = xrf.readUInt32LE(xrfBlock + entry * 4)
    for (const offset of pointerCandidates(word)) {
      const header = readHeader(offset)
      const plausible = header.base === 18 + 6 * header.nvf && header.mfrl16 >= header.base && header.mfrl16 <= 65535
      if (plausible || shown < 10) {
        console.log(JSON.stringify({ xrfBlock, entry, word, ...header, plausible }))
        shown += 1
      }
    }
  }
}
