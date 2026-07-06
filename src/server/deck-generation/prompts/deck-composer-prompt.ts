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
Use dense, evidence-grounded healthcare professional training content.
Use the attached rendered design PDF page images as visual references for layout, color, typography, spacing, and density.
Ensure spacing, margins, line-height, and content grouping keep every slide readable and clear for the user; avoid cramped, overlapping, clipped, or edge-to-edge text.
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
  const styleUrl = input.styleUrl.trim() ? input.styleUrl.trim() : "not supplied"

  return `Reference PDF: ${reference.fileName} (${reference.pageCount} pages)
Design PDF: ${design.fileName} (${design.pageCount} pages)

User prompt: ${extraPrompt}
Style URL: ${styleUrl}

Factual source material:
${JSON.stringify(facts, null, 2)}

Attached rendered design PDF page images are the primary visual style source. Mirror their visual system without copying product names or irrelevant text.

Design page metadata for the attached images:
${JSON.stringify(serializableDesignSamples(design), null, 2)}

Compose a complete standalone HTML document with inline CSS.`
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
