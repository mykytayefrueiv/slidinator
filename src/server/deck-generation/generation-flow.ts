import type { GenerateDeckResult, RepairDeckHtml } from "./types"
import { validateDeckHtml } from "./html-deck-validation"

type GenerateDeckArtifactOptions<TInput> = {
  input: TInput
  generate: (input: TInput) => Promise<GenerateDeckResult>
  repairDeckHtml?: RepairDeckHtml
}

export class DeckHtmlValidationError extends Error {
  constructor(
    readonly validationErrors: ReturnType<typeof validateDeckHtml>["errors"],
    message = "Generated deck HTML failed validation."
  ) {
    super(formatValidationErrorMessage(message, validationErrors))
    this.name = "DeckHtmlValidationError"
  }
}

export async function generateDeckArtifact<TInput>({
  input,
  generate,
  repairDeckHtml,
}: GenerateDeckArtifactOptions<TInput>): Promise<GenerateDeckResult> {
  const generatedDeck = await generate(input)
  const initialValidation = validateDeckHtml(generatedDeck.deckHtml)

  if (initialValidation.valid) {
    return { ...generatedDeck, slideCount: initialValidation.slideCount }
  }

  if (!repairDeckHtml) {
    throw new DeckHtmlValidationError(initialValidation.errors)
  }

  const repairedHtml = await repairDeckHtml({
    invalidHtml: generatedDeck.deckHtml,
    errors: initialValidation.errors,
  })
  const repairedValidation = validateDeckHtml(repairedHtml)

  if (!repairedValidation.valid) {
    throw new DeckHtmlValidationError(
      repairedValidation.errors,
      "Generated deck HTML failed validation after repair."
    )
  }

  return {
    ...generatedDeck,
    deckHtml: repairedHtml,
    slideCount: repairedValidation.slideCount,
  }
}

function formatValidationErrorMessage(
  message: string,
  validationErrors: ReturnType<typeof validateDeckHtml>["errors"]
) {
  const errorSummary = validationErrors
    .map((error) => `${error.code}: ${error.message}`)
    .join(" ")

  return `${message} ${errorSummary}`
}
