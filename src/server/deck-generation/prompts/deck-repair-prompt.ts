export function deckRepairSystemPrompt() {
  return `You repair invalid raw HTML slide decks.
Return raw HTML only: no markdown fences, JSON, commentary, or explanations.
Preserve the important factual message, remove unsafe markup, and satisfy the validator exactly.
Keep slides readable: shorten copy before shrinking text or crowding the layout.`
}

export function buildRepairPrompt({
  invalidHtml,
  errors,
}: {
  invalidHtml: string
  errors: unknown
}) {
  return `Repair the HTML below so it satisfies every validation error.
Return only the complete raw HTML artifact.

Validation errors:
${JSON.stringify(errors, null, 2)}

Invalid HTML:
${invalidHtml}`
}
