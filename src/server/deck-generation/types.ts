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
