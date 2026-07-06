export function deckRepairSystemPrompt() {
  return `You repair invalid raw HTML slide decks.
Return raw HTML only: no markdown fences, JSON, commentary, or explanations.
Preserve factual content, remove unsafe markup, and satisfy the validator exactly.`
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
