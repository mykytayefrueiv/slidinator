import { DeckGenerationUserError } from "../generation-errors"
import { assertPdfFile, loadPdfDocument } from "./pdf-runtime"
import type { DesignSourceMaterial } from "../types"
import type { PdfPage } from "./pdf-runtime"

const MAX_DESIGN_SAMPLE_PAGES = 3
const MAX_DESIGN_TEXT_BLOCKS_PER_PAGE = 24
const DESIGN_RENDER_WIDTH = 1280

export async function renderDesignReference(
  file: File
): Promise<DesignSourceMaterial> {
  assertPdfFile(file, "Design PDF")

  try {
    const document = await loadPdfDocument(file)
    const pageLimit = Math.min(document.numPages, MAX_DESIGN_SAMPLE_PAGES)

    console.log("[deck-generation] rendering design PDF", {
      fileName: file.name,
      pageCount: document.numPages,
      pageLimit,
      renderWidth: DESIGN_RENDER_WIDTH,
    })

    const samples = await Promise.all(
      Array.from({ length: pageLimit }, async (_, index) => {
        const pageNumber = index + 1
        const page = await document.getPage(pageNumber)
        const viewport = page.getViewport({ scale: 1 })
        const renderScale = DESIGN_RENDER_WIDTH / viewport.width
        const renderViewport = page.getViewport({ scale: renderScale })
        const [renderedImage, textBlocks] = await Promise.all([
          renderPageToPng(page, renderViewport),
          sampleTextBlocks(page),
        ])

        const sample = {
          pageNumber,
          width: Math.round(viewport.width),
          height: Math.round(viewport.height),
          renderedImage,
          textBlocks,
        }

        console.log("[deck-generation] rendered design PDF page", {
          fileName: file.name,
          pageNumber,
          renderedWidth: renderedImage.width,
          renderedHeight: renderedImage.height,
          imageBytes: renderedImage.data.byteLength,
          textBlockCount: textBlocks.length,
        })

        return sample
      })
    )

    if (samples.length === 0) {
      throw new DeckGenerationUserError(
        "extraction",
        "Design PDF rendering produced no page images."
      )
    }

    return {
      fileName: file.name || "design.pdf",
      pageCount: document.numPages,
      samples,
    }
  } catch (error) {
    if (error instanceof DeckGenerationUserError) {
      throw error
    }

    throw new DeckGenerationUserError(
      "extraction",
      "Could not render and sample the design PDF pages.",
      error
    )
  }
}

async function renderPageToPng(
  page: PdfPage,
  viewport: { width: number; height: number }
) {
  const { createCanvas } = await import("@napi-rs/canvas")
  const width = Math.round(viewport.width)
  const height = Math.round(viewport.height)
  const canvas = createCanvas(width, height)
  const canvasContext = canvas.getContext("2d")

  await page.render({
    canvas,
    canvasContext,
    viewport,
  }).promise

  return {
    data: canvas.toBuffer("image/png"),
    mediaType: "image/png" as const,
    width,
    height,
  }
}

async function sampleTextBlocks(page: PdfPage) {
  const textContent = await page.getTextContent()
  const textBlocks = []

  for (const item of textContent.items) {
    const text = item.str?.trim() ?? ""

    if (!text) {
      continue
    }

    const transform = item.transform ?? []

    textBlocks.push({
      text,
      x: Math.round(transform[4] ?? 0),
      y: Math.round(transform[5] ?? 0),
      fontName: item.fontName,
    })

    if (textBlocks.length >= MAX_DESIGN_TEXT_BLOCKS_PER_PAGE) {
      break
    }
  }

  return textBlocks
}
