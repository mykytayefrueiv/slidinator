import type {
  DeckGenerationInput,
  DesignSourceMaterial,
  FactBrief,
  ReferenceSourceMaterial,
} from "../types"

export function deckComposerSystemPrompt() {
  return `You compose raw HTML slide decks for pharmaceutical training.
Return raw HTML only: no markdown fences, JSON, commentary, or explanations.
The HTML must contain exactly 2 or 3 <section class="slide-page"> sections.
Make the deck readable at a glance. Prefer fewer, stronger points over completeness.
Each slide should have one clear message, 2-4 content groups, and no more than 6 short bullets total.
Use generous whitespace, large type, and short labels. Avoid tiny footnotes, dense tables, crowded cards, and text-heavy multi-column layouts.
If there is too much source material, omit lower-priority details instead of shrinking text or adding more boxes.
Use the attached rendered design PDF page images as visual references for color, typography, and layout style, but simplify the content density.
Use deterministic print CSS: @page { size: 1280px 720px; margin: 0; }.
Each .slide-page must be 1280px by 720px and use break-after: page or page-break-after: always.
Do not include script tags or inline event handlers.`
}

export function buildDeckComposerPrompt({
  input,
  reference,
  design,
  facts,
}: {
  input: DeckGenerationInput
  reference: ReferenceSourceMaterial
  design: DesignSourceMaterial
  facts: FactBrief
}) {
  const extraPrompt = input.extraPrompt.trim()
    ? input.extraPrompt.trim()
    : "Create a concise pharma training deck."
  const styleUrl = input.styleUrl.trim()
    ? input.styleUrl.trim()
    : "not supplied"

  return `Reference PDF: ${reference.fileName} (${reference.pageCount} pages)
Design PDF: ${design.fileName} (${design.pageCount} pages)

User prompt: ${extraPrompt}
Style URL: ${styleUrl}

Factual source material:
${JSON.stringify(facts, null, 2)}

Attached rendered design PDF page images are the primary visual style source. Mirror their visual system without copying product names, irrelevant text, or dense information load.

Design page metadata for the attached images:
${JSON.stringify(serializableDesignSamples(design), null, 2)}

Compose a complete standalone HTML document with inline CSS. Keep the result simple, spacious, and presentation-ready.`
}

function serializableDesignSamples(design: DesignSourceMaterial) {
  return design.samples.map(({ renderedImage, ...sample }) => ({
    ...sample,
    renderedImage: renderedImage
      ? {
          mediaType: renderedImage.mediaType,
          width: renderedImage.width,
          height: renderedImage.height,
          byteLength: renderedImage.data.byteLength,
        }
      : undefined,
  }))
}
