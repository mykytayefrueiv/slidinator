import { validateDeckHtml } from "../validation/html-deck-validation"

export type ExportHtmlDeckToPdfInput = {
  deckHtml: string
}

export async function exportHtmlDeckToPdf({
  deckHtml,
}: ExportHtmlDeckToPdfInput): Promise<Uint8Array> {
  const validation = validateDeckHtml(deckHtml)

  if (!validation.valid) {
    throw new InvalidDeckHtmlForPdfError(validation.errors[0]?.message)
  }

  const { chromium } = await import("playwright")
  const browser = await chromium.launch()

  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
    })

    await page.setContent(deckHtml, { waitUntil: "networkidle" })
    await page.emulateMedia({ media: "print" })

    return await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
    })
  } finally {
    await browser.close()
  }
}

export class InvalidDeckHtmlForPdfError extends Error {
  constructor(message = "Deck HTML is invalid and cannot be exported to PDF.") {
    super(message)
    this.name = "InvalidDeckHtmlForPdfError"
  }
}
