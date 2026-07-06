import { DeckGenerationUserError } from "../generation-errors"
import {
  assertPdfFile,
  loadPdfDocument,
} from "./pdf-runtime"
import type { ReferenceSourceMaterial } from "../types"

const MAX_REFERENCE_TEXT_LENGTH = 24_000

export async function extractReferenceSource(
  file: File
): Promise<ReferenceSourceMaterial> {
  assertPdfFile(file, "Reference PDF")

  try {
    const document = await loadPdfDocument(file)
    const pages: Array<string> = []

    console.log("[deck-generation] extracting reference PDF", {
      fileName: file.name,
      pageCount: document.numPages,
    })

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item) => item.str?.trim() ?? "")
        .filter(Boolean)
        .join(" ")

      if (pageText) {
        pages.push(`Page ${pageNumber}: ${pageText}`)
      }

      if (pages.join("\n\n").length >= MAX_REFERENCE_TEXT_LENGTH) {
        break
      }
    }

    const text = pages.join("\n\n").slice(0, MAX_REFERENCE_TEXT_LENGTH)

    console.log("[deck-generation] reference PDF extracted", {
      fileName: file.name,
      pagesRead: pages.length,
      textLength: text.length,
    })

    if (!text.trim()) {
      throw new DeckGenerationUserError(
        "extraction",
        "Reference PDF text extraction produced no readable factual content."
      )
    }

    return {
      fileName: file.name || "reference.pdf",
      pageCount: document.numPages,
      text,
    }
  } catch (error) {
    if (error instanceof DeckGenerationUserError) {
      throw error
    }

    throw new DeckGenerationUserError(
      "extraction",
      "Could not extract readable factual content from the reference PDF.",
      error
    )
  }
}
