import { beforeEach, describe, expect, test, vi } from "vitest"
import type * as PdfExportModule from "@/server/deck-generation/pdf/export-html-to-pdf"

const exportHtmlDeckToPdfMock = vi.fn()

vi.mock("@/server/deck-generation/pdf/export-html-to-pdf", async () => {
  const actual = await vi.importActual<typeof PdfExportModule>(
    "@/server/deck-generation/pdf/export-html-to-pdf"
  )

  return {
    ...actual,
    exportHtmlDeckToPdf: exportHtmlDeckToPdfMock,
  }
})

const validDeckHtml = `<!doctype html>
<html>
  <head>
    <style>
      @page { size: 1280px 720px; margin: 0; }
      .slide-page { width: 1280px; height: 720px; break-after: page; }
    </style>
  </head>
  <body>
    <section class="slide-page">One</section>
    <section class="slide-page">Two</section>
  </body>
</html>`

describe("deck PDF export server function", () => {
  beforeEach(() => {
    exportHtmlDeckToPdfMock.mockReset()
  })

  test("returns serializable PDF bytes for a valid HTML deck artifact", async () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46])
    exportHtmlDeckToPdfMock.mockResolvedValue(pdfBytes)
    const { exportDeckPdfBytes } = await import("@/server/deck-generation/api")

    const result = await exportDeckPdfBytes({ deckHtml: validDeckHtml })

    expect(result).toEqual({ pdfBytes: [0x25, 0x50, 0x44, 0x46] })
    expect(exportHtmlDeckToPdfMock).toHaveBeenCalledWith({
      deckHtml: validDeckHtml,
    })
  })
})
