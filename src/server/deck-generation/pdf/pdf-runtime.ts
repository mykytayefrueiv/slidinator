import { DeckGenerationUserError } from "../generation-errors"

export type PdfDocument = {
  numPages: number
  getPage: (pageNumber: number) => Promise<PdfPage>
}

export type PdfPage = {
  getTextContent: () => Promise<{
    items: Array<{
      str?: string
      transform?: Array<number>
      fontName?: string
    }>
  }>
  getViewport: (options: { scale: number }) => { width: number; height: number }
  render: (options: {
    canvasContext: unknown
    viewport: unknown
    canvas?: unknown
  }) => { promise: Promise<void> }
}

export async function loadPdfDocument(file: File): Promise<PdfDocument> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
  const data = new Uint8Array(await file.arrayBuffer())

  return pdfjs.getDocument({
    data,
    disableFontFace: true,
    useSystemFonts: true,
  }).promise as Promise<PdfDocument>
}

export function assertPdfFile(file: File, label: string) {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")

  if (!isPdf) {
    throw new DeckGenerationUserError(
      "upload",
      `${label} must be a PDF file.`
    )
  }
}
