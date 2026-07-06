import { describe, expect, test, vi } from "vitest"

import {
  DeckHtmlValidationError,
  generateDeckArtifact,
} from "../generation-flow"
import type { GenerateDeckResult } from "../types"

function validDeckHtml() {
  return `<!doctype html>
<html>
  <head>
    <style>
      @page { size: 1280px 720px; margin: 0; }
      .slide-page { width: 1280px; height: 720px; page-break-after: always; }
    </style>
  </head>
  <body>
    <section class="slide-page">One</section>
    <section class="slide-page">Two</section>
  </body>
</html>`
}

function invalidDeckHtml() {
  return `<!doctype html>
<html>
  <head><style>.slide-page { width: 1280px; }</style></head>
  <body><section class="slide-page">One</section></body>
</html>`
}

function deckResult(deckHtml: string): GenerateDeckResult {
  return {
    artifactId: "test-artifact",
    deckHtml,
    slideCount: 99,
    sourceSummary: {
      referenceFileName: "reference.pdf",
      designFileName: "design.pdf",
      extraPrompt: "test",
      styleUrl: "",
    },
  }
}

describe("generateDeckArtifact", () => {
  test("returns valid generated HTML without repair", async () => {
    const repairDeckHtml = vi.fn()

    await expect(
      generateDeckArtifact({
        input: undefined,
        generate: async () => deckResult(validDeckHtml()),
        repairDeckHtml,
      })
    ).resolves.toMatchObject({
      deckHtml: validDeckHtml(),
      slideCount: 2,
    })
    expect(repairDeckHtml).not.toHaveBeenCalled()
  })

  test("repairs invalid HTML once and returns corrected HTML", async () => {
    const repairDeckHtml = vi.fn(async () => validDeckHtml())

    const result = await generateDeckArtifact({
      input: undefined,
      generate: async () => deckResult(invalidDeckHtml()),
      repairDeckHtml,
    })

    expect(result.deckHtml).toBe(validDeckHtml())
    expect(result.slideCount).toBe(2)
    expect(repairDeckHtml).toHaveBeenCalledOnce()
    expect(repairDeckHtml).toHaveBeenCalledWith({
      invalidHtml: invalidDeckHtml(),
      errors: expect.arrayContaining([
        expect.objectContaining({ code: "wrong-slide-count" }),
        expect.objectContaining({ code: "missing-print-css" }),
        expect.objectContaining({ code: "missing-page-breaks" }),
      ]),
    })
  })

  test("surfaces validation errors when repair output is still invalid", async () => {
    await expect(
      generateDeckArtifact({
        input: undefined,
        generate: async () => deckResult(invalidDeckHtml()),
        repairDeckHtml: async () => invalidDeckHtml(),
      })
    ).rejects.toThrow(DeckHtmlValidationError)
  })

  test("surfaces validation errors when no repair function is available", async () => {
    await expect(
      generateDeckArtifact({
        input: undefined,
        generate: async () => deckResult(invalidDeckHtml()),
      })
    ).rejects.toThrow("Generated deck HTML failed validation.")
  })
})
