import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import type { DeckGenerationInput } from "./types"

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

export const generateDeck = createServerFn({ method: "POST" })
  .validator(GenerateDeckFormSchema)
  .handler(async ({ data }) => {
    const { generateDeckArtifact } = await import("./generation-flow")
    const { createMockDeck } = await import("./mock-deck.server")

    return generateDeckArtifact({
      input: data,
      generate: createMockDeck,
    })
  })
