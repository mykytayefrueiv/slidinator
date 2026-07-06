import type { EditDeckModelRequest } from "../types"

export function deckEditSystemPrompt() {
  return `You edit raw HTML slide decks.
Return raw HTML only: no markdown fences, JSON, commentary, or explanations.
Return a complete updated HTML document, not a fragment.
Preserve the existing slide deck contract: exactly 2 or 3 .slide-page sections, @page size 1280px 720px with margin 0, fixed 1280px by 720px slides, page breaks, no scripts, and no inline event handlers.
Make only the requested edits. Keep unrelated content, factual meaning, and visual style stable.`
}

export function buildDeckEditPrompt({
  deckId,
  currentHtml,
  selections,
  slideImages,
}: EditDeckModelRequest) {
  const selectedSlideIds = [
    ...new Set(selections.map((selection) => selection.slideId)),
  ]

  return `Edit the current deck HTML for deck "${deckId}".
Use the attached slide screenshots as visual context. Selection rectangles may be visible in the screenshots; the normalized geometry below is authoritative.

Selected slide IDs:
${JSON.stringify(selectedSlideIds, null, 2)}

Area selections:
${JSON.stringify(
  selections.map((selection) => ({
    id: selection.id,
    slideId: selection.slideId,
    order: selection.order,
    normalizedRect: selection.normalizedRect,
    prompt: selection.prompt,
  })),
  null,
  2
)}

Attached slide images:
${JSON.stringify(
  slideImages.map((image) => ({
    slideId: image.slideId,
    mimeType: image.mimeType,
    dataDescription: "attached as multimodal image content",
  })),
  null,
  2
)}

Instructions:
- Apply each selection prompt to its corresponding selected region.
- Use normalizedRect coordinates relative to that selection's .slide-page.
- If a prompt conflicts with safety, factual accuracy, or the source deck, make the smallest safe alternative.
- Return only the complete updated raw HTML artifact.

Current HTML:
${currentHtml}`
}
