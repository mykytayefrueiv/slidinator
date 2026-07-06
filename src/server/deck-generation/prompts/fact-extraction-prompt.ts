import type { ReferenceSourceMaterial } from "../types"

export function buildFactExtractionPrompt(reference: ReferenceSourceMaterial) {
  return {
    system: `Extract factual training material from pharmaceutical reference text.
Do not invent claims beyond the source.`,
    user: `Reference file: ${reference.fileName}
Pages: ${reference.pageCount}

Return concise factual material suitable for healthcare professional training.

${reference.text}`,
  }
}
