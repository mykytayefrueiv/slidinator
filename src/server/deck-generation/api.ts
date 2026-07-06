import { createServerFn } from "@tanstack/react-start"
import { isRedirect, redirect } from "@tanstack/react-router"
import { z } from "zod"

import { DeckGenerationUserError, toUserFacingError } from "./generation-errors"
import { getGeneratedDeck } from "./history-store"
import type { DeckGenerationInput } from "./types"
import type * as EditDeckModule from "./edit-deck"
import type * as PdfExportModule from "./pdf/export-html-to-pdf"

const PdfFileSchema = z.instanceof(File, {
  message: "PDF file is required.",
})

const OptionalTextSchema = z.preprocess((value) => value ?? "", z.string())

const GenerateDeckFormSchema = z
  .instanceof(FormData)
  .transform((formData): DeckGenerationInput => ({
    referenceFile: PdfFileSchema.parse(formData.get("referencePdf")),
    designFile: PdfFileSchema.parse(formData.get("designPdf")),
    extraPrompt: OptionalTextSchema.parse(formData.get("extraPrompt")),
    styleUrl: OptionalTextSchema.parse(formData.get("styleUrl")),
  }))

const ExportDeckPdfSchema = z.object({
  deckHtml: z.string().min(1, "Deck HTML is required."),
})

const SelectionRectSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
})

const AreaSelectionSchema = z.object({
  id: z.string().min(1, "Selection ID is required."),
  slideId: z.string().min(1, "Slide ID is required."),
  order: z.number().int().positive(),
  renderedRect: SelectionRectSchema.optional(),
  normalizedRect: SelectionRectSchema,
  prompt: z.string().min(1, "Selection prompt is required."),
})

const EditDeckSchema = z.object({
  deckId: z.string().min(1, "Deck ID is required."),
  currentHtml: z.string().min(1, "Current deck HTML is required."),
  selections: z
    .array(AreaSelectionSchema)
    .min(1, "At least one selection is required."),
})

const DeckIdSchema = z.object({
  deckId: z.string().min(1, "Deck ID is required."),
})

export const generateDeck = createServerFn({ method: "POST" })
  .validator(GenerateDeckFormSchema)
  .handler(async ({ data }) => {
    try {
      const { generateSlides } = await import("./generate-slides")

      console.log("[deck-generation] request accepted", {
        referenceFileName: data.referenceFile.name,
        referenceFileSize: data.referenceFile.size,
        designFileName: data.designFile.name,
        designFileSize: data.designFile.size,
        hasExtraPrompt: Boolean(data.extraPrompt.trim()),
        hasStyleUrl: Boolean(data.styleUrl.trim()),
      })

      const result = await generateSlides(data)

      throw redirect({
        to: "/pdf/$deckId",
        params: { deckId: result.artifactId },
      })
    } catch (error) {
      if (isRedirect(error)) {
        throw error
      }

      const userFacingError = toUserFacingError(error)

      console.error("[deck-generation] request failed", {
        code: userFacingError.code,
        message: userFacingError.message,
      })

      throw new DeckGenerationUserError(
        userFacingError.code,
        userFacingError.message,
        userFacingError.cause
      )
    }
  })

export const getGeneratedDeckById = createServerFn({ method: "GET" })
  .validator(DeckIdSchema)
  .handler(({ data }) => {
    const deck = getGeneratedDeck(data.deckId)

    if (!deck) {
      throw new Error(
        "Generated deck history was not found. In-memory prototype history is cleared when the server restarts."
      )
    }

    return deck
  })

export const exportDeckPdf = createServerFn({ method: "POST" })
  .validator(ExportDeckPdfSchema)
  .handler(async ({ data }) => exportDeckPdfBytes(data))

export const editDeck = createServerFn({ method: "POST" })
  .validator(EditDeckSchema)
  .handler(async ({ data }) => editDeckData(data))

export async function exportDeckPdfBytes({
  deckHtml,
}: z.infer<typeof ExportDeckPdfSchema>) {
  const pdfExporterPath = "./pdf/export-html-to-pdf"
  const { InvalidDeckHtmlForPdfError, exportHtmlDeckToPdf } = (await import(
    /* @vite-ignore */ pdfExporterPath
  )) as typeof PdfExportModule

  try {
    const pdfBytes = await exportHtmlDeckToPdf({ deckHtml })

    return { pdfBytes: Array.from(pdfBytes) }
  } catch (error) {
    if (error instanceof InvalidDeckHtmlForPdfError) {
      throw error
    }

    console.error("[deck-generation] PDF export failed", error)

    throw new Error("Failed to export the deck PDF.")
  }
}

export async function editDeckData(data: z.infer<typeof EditDeckSchema>) {
  const editDeckPath = "./edit-deck"
  const { editDeck: editDeckArtifact } = (await import(
    /* @vite-ignore */ editDeckPath
  )) as typeof EditDeckModule

  try {
    return await editDeckArtifact(data)
  } catch (error) {
    console.error("[deck-generation] deck edit failed", error)

    if (error instanceof DeckGenerationUserError) {
      throw error
    }

    throw new DeckGenerationUserError(
      "model-generation",
      "Failed to edit the deck."
    )
  }
}
