import { DeckGenerationUserError } from "./generation-errors"
import { createOpenRouterDeckGenerationModel } from "./ai/openrouter-deck-generation-model"
import { extractReferenceSource } from "./pdf/reference-source"
import { renderDesignReference } from "./pdf/design-reference"
import { validateDeckHtml } from "./validation/html-deck-validation"
import type {
  DeckGenerationInput,
  DeckValidationError,
  GenerateDeckResult,
} from "./types"

export async function generateSlides(
  input: DeckGenerationInput
): Promise<GenerateDeckResult> {
  const model = createOpenRouterDeckGenerationModel()
  const reference = await extractReferenceSource(input.referenceFile)
  const design = await renderDesignReference(input.designFile)
  const attachedDesignImages = design.samples.filter(
    (sample) => sample.renderedImage
  ).length

  console.log("[deck-generation] source material ready", {
    referencePages: reference.pageCount,
    referenceTextLength: reference.text.length,
    designPages: design.pageCount,
    sampledDesignPages: design.samples.length,
    attachedDesignImages,
  })

  console.log("[deck-generation] extracting factual material")
  const facts = await model.extractFacts(reference)

  console.log("[deck-generation] composing deck HTML", {
    attachedDesignImages,
  })

  const deckHtml = await model.composeDeckHtml({
    upload: input,
    reference,
    design,
    facts,
  })

  console.log("[deck-generation] deck HTML composed", {
    htmlLength: deckHtml.length,
  })

  const validation = validateDeckHtml(deckHtml)

  if (validation.valid) {
    return deckResult({
      input,
      referenceFileName: reference.fileName,
      designFileName: design.fileName,
      provider: model.providerName,
      deckHtml,
      slideCount: validation.slideCount,
    })
  }

  console.log("[deck-generation] repairing deck HTML", {
    errorCodes: validation.errors.map((error) => error.code),
    invalidHtmlLength: deckHtml.length,
  })

  const repairedHtml = await model.repairDeckHtml({
    invalidHtml: deckHtml,
    errors: validation.errors,
  })

  console.log("[deck-generation] deck HTML repair completed", {
    repairedHtmlLength: repairedHtml.length,
  })

  const repairedValidation = validateDeckHtml(repairedHtml)

  if (!repairedValidation.valid) {
    throw new DeckGenerationUserError(
      "validation",
      formatValidationErrorMessage(
        "Generated deck HTML failed validation after repair.",
        repairedValidation.errors
      )
    )
  }

  return deckResult({
    input,
    referenceFileName: reference.fileName,
    designFileName: design.fileName,
    provider: model.providerName,
    deckHtml: repairedHtml,
    slideCount: repairedValidation.slideCount,
  })
}

function deckResult({
  input,
  referenceFileName,
  designFileName,
  provider,
  deckHtml,
  slideCount,
}: {
  input: DeckGenerationInput
  referenceFileName: string
  designFileName: string
  provider: string
  deckHtml: string
  slideCount: number
}): GenerateDeckResult {
  return {
    artifactId: `deck-${crypto.randomUUID()}`,
    deckHtml,
    slideCount,
    sourceSummary: {
      referenceFileName,
      designFileName,
      extraPrompt: input.extraPrompt.trim(),
      styleUrl: input.styleUrl.trim(),
      provider,
    },
  }
}

function formatValidationErrorMessage(
  message: string,
  validationErrors: Array<DeckValidationError>
) {
  const errorSummary = validationErrors
    .map((error) => `${error.code}: ${error.message}`)
    .join(" ")

  return `${message} ${errorSummary}`
}
