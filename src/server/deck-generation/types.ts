export type GenerateDeckResult = {
  artifactId: string
  deckHtml: string
  slideCount: number
  sourceSummary: {
    referenceFileName: string
    designFileName: string
    extraPrompt: string
    styleUrl: string
    provider?: string
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

export type ReferenceSourceMaterial = {
  fileName: string
  pageCount: number
  text: string
}

export type FactBrief = {
  productName: string
  audience: string
  keyFacts: Array<string>
  safetyPoints: Array<string>
  trainingTakeaways: Array<string>
}

export type DesignPageImage = {
  data: Buffer
  mediaType: "image/png"
  width: number
  height: number
}

export type DesignPageSample = {
  pageNumber: number
  width: number
  height: number
  renderedImage?: DesignPageImage
  textBlocks: Array<{
    text: string
    x: number
    y: number
    fontName?: string
  }>
}

export type DesignSourceMaterial = {
  fileName: string
  pageCount: number
  samples: Array<DesignPageSample>
}
