import { createOpenRouterDeckGenerationModel } from "./ai/openrouter-deck-generation-model"
import { DeckGenerationUserError } from "./generation-errors"
import {
  appendDeckEditHistory,
  getDeckHistory,
  getGeneratedDeck,
} from "./history-store"
import { renderSlideImagesForSelections } from "./pdf/render-slide-images"
import { validateDeckHtml } from "./validation/html-deck-validation"
import type { DeckGenerationModel } from "./ai/openrouter-deck-generation-model"
import type {
  DeckValidationError,
  EditDeckRequest,
  GenerateDeckResult,
} from "./types"

export async function editDeck(
  request: EditDeckRequest,
  model: DeckGenerationModel = createOpenRouterDeckGenerationModel()
): Promise<GenerateDeckResult> {
  const history = getDeckHistory(request.deckId)
  const currentDeck = getGeneratedDeck(request.deckId)

  if (!history || !currentDeck) {
    throw new DeckGenerationUserError(
      "validation",
      "Generated deck history was not found. In-memory prototype history is cleared when the server restarts."
    )
  }

  if (currentDeck.artifactId !== request.deckId) {
    throw new DeckGenerationUserError(
      "validation",
      "Edit request deck ID does not match the current deck workspace."
    )
  }

  if (currentDeck.deckHtml !== request.currentHtml) {
    throw new DeckGenerationUserError(
      "validation",
      "Edit request HTML is out of date for this deck. Refresh the deck before editing."
    )
  }

  console.log("[deck-generation] edit request accepted", {
    deckId: request.deckId,
    historyMessages: history.length,
    selectionCount: request.selections.length,
  })

  const slideImages = await renderSlideImagesForSelections({
    deckHtml: request.currentHtml,
    selections: request.selections,
  })
  const modelRequest = {
    ...request,
    slideImages: slideImages.map((image) => ({
      slideId: image.slideId,
      mimeType: image.mediaType,
      data: image.dataUrl,
    })),
  }

  console.log("[deck-generation] edit image context rendered", {
    deckId: request.deckId,
    slideImageCount: modelRequest.slideImages.length,
  })

  const editedHtml = await model.editDeckHtml(modelRequest)
  const validation = validateDeckHtml(editedHtml)
  const validHtml = validation.valid
    ? editedHtml
    : await repairEditedHtml({ editedHtml, errors: validation.errors, model })

  const finalValidation = validateDeckHtml(validHtml)

  if (!finalValidation.valid) {
    throw new DeckGenerationUserError(
      "validation",
      formatValidationErrorMessage(
        "Edited deck HTML failed validation after repair.",
        finalValidation.errors
      )
    )
  }

  const editedDeck: GenerateDeckResult = {
    ...currentDeck,
    deckHtml: validHtml,
    slideCount: finalValidation.slideCount,
    sourceSummary: {
      ...currentDeck.sourceSummary,
      provider: model.providerName,
    },
  }

  appendDeckEditHistory({
    deckId: request.deckId,
    request: modelRequest,
    deck: editedDeck,
  })

  return editedDeck
}

async function repairEditedHtml({
  editedHtml,
  errors,
  model,
}: {
  editedHtml: string
  errors: Array<DeckValidationError>
  model: DeckGenerationModel
}) {
  console.log("[deck-generation] repairing edited deck HTML", {
    errorCodes: errors.map((error) => error.code),
    invalidHtmlLength: editedHtml.length,
  })

  return model.repairDeckHtml({
    invalidHtml: editedHtml,
    errors,
  })
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
