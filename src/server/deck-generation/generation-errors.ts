export type DeckGenerationErrorCode =
  "upload" | "extraction" | "model-generation" | "validation" | "repair"

export class DeckGenerationUserError extends Error {
  constructor(
    readonly code: DeckGenerationErrorCode,
    message: string,
    readonly cause?: unknown
  ) {
    super(message)
    this.name = "DeckGenerationUserError"
  }
}

export function toUserFacingError(error: unknown) {
  if (error instanceof DeckGenerationUserError) {
    return error
  }

  return new DeckGenerationUserError(
    "model-generation",
    "Deck generation failed. Please try again with clearer source PDFs or a shorter prompt.",
    error
  )
}
