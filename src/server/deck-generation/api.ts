import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import {
  DeckGenerationUserError,
  toUserFacingError,
} from "./generation-errors"
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

      return await generateSlides(data)
    } catch (error) {
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
