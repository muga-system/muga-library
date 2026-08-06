/** @vitest-environment node */

import { JSDOM } from "jsdom"
import { strToU8, zipSync } from "fflate"
import { describe, expect, it } from "vitest"
import { parseXlsx } from "./xlsx"

globalThis.DOMParser = new JSDOM().window.DOMParser

const text = (value: string) => strToU8(value)

describe("parseXlsx", () => {
  it("reads the first sheet, shared strings and inline strings", async () => {
    const archive = zipSync({
      "xl/workbook.xml": text('<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Libros" r:id="rId1"/></sheets></workbook>'),
      "xl/_rels/workbook.xml.rels": text('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>'),
      "xl/sharedStrings.xml": text('<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>Título</t></si><si><t>Libro de prueba</t></si></sst>'),
      "xl/worksheets/sheet1.xml": text('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="inlineStr"><is><t>Autor</t></is></c></row><row r="2"><c r="A2" t="s"><v>1</v></c><c r="B2"><v>Autora</v></c></row></sheetData></worksheet>'),
    })

    const exactArchive = new Uint8Array(archive.byteLength)
    exactArchive.set(archive)
    const result = await parseXlsx(exactArchive.buffer)
    expect(result).toEqual([{ Título: "Libro de prueba", Autor: "Autora" }])
  })
})
