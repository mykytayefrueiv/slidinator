export type GenerateDeckResult = {
  artifactId: string
  deckHtml: string
  slideCount: number
  sourceSummary: {
    referenceFileName: string
    designFileName: string
    extraPrompt: string
    styleUrl: string
  }
}

export type DeckGenerationInput = {
  referenceFile: File
  designFile: File
  extraPrompt: string
  styleUrl: string
}

export type DeckValidationErrorCode =
  | "html-parse-error"
  | "missing-slide-page"
  | "wrong-slide-count"
  | "missing-print-css"
  | "missing-page-breaks"
  | "script-tag-not-allowed"
  | "inline-event-handler-not-allowed"

export type DeckValidationError = {
  code: DeckValidationErrorCode
  message: string
  details?: Record<string, string | number | boolean>
}

export type DeckValidationResult =
  | {
      valid: true
      slideCount: number
      errors: []
    }
  | {
      valid: false
      slideCount: number
      errors: Array<DeckValidationError>
    }

export type RepairDeckHtmlInput = {
  invalidHtml: string
  errors: Array<DeckValidationError>
}

export type RepairDeckHtml = (input: RepairDeckHtmlInput) => Promise<string>
