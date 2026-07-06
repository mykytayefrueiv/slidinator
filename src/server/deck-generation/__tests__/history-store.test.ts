import { beforeEach, describe, expect, test } from "vitest"

import {
  clearDeckHistoryForTests,
  getDeckHistory,
  getGeneratedDeck,
  storeGeneratedDeckHistory,
  storeDeckHistory,
} from "../history-store"
import type {
  DesignSourceMaterial,
  FactBrief,
  GenerateDeckResult,
  ReferenceSourceMaterial,
} from "../types"

function deckResult(artifactId: string, deckHtml: string): GenerateDeckResult {
  return {
    artifactId,
    deckHtml,
    slideCount: 1,
    sourceSummary: {
      referenceFileName: "reference.pdf",
      designFileName: "design.pdf",
      extraPrompt: "Focus on safety",
      styleUrl: "https://example.com/style",
      provider: "test-provider",
    },
  }
}

const reference: ReferenceSourceMaterial = {
  fileName: "reference.pdf",
  pageCount: 2,
  text: "Extracted reference text",
}

const design: DesignSourceMaterial = {
  fileName: "design.pdf",
  pageCount: 1,
  samples: [
    {
      pageNumber: 1,
      width: 1280,
      height: 720,
      textBlocks: [{ text: "Headline", x: 20, y: 30 }],
    },
  ],
}

const facts: FactBrief = {
  productName: "Mock Product",
  audience: "Pharmacists",
  keyFacts: ["Fact one"],
  safetyPoints: ["Safety one"],
  trainingTakeaways: ["Takeaway one"],
}

describe("deck generation history store", () => {
  beforeEach(() => {
    clearDeckHistoryForTests()
  })

  test("stores reusable generation context and assistant HTML response by deck ID", () => {
    const deck = deckResult("deck-one", "<html>One</html>")
    const referenceFile = new File(["%PDF-reference"], "reference.pdf", {
      type: "application/pdf",
    })
    const designFile = new File(["%PDF-design"], "design.pdf", {
      type: "application/pdf",
    })

    const deckId = storeGeneratedDeckHistory({
      input: {
        referenceFile,
        designFile,
        extraPrompt: " Focus on safety ",
        styleUrl: " https://example.com/style ",
      },
      reference,
      design,
      facts,
      deck,
    })

    expect(deckId).toBe("deck-one")
    expect(getGeneratedDeck("deck-one")).toEqual(deck)
    expect(getDeckHistory("deck-one")).toEqual([
      {
        role: "user",
        content: {
          upload: {
            referenceFileName: "reference.pdf",
            referenceFileSize: referenceFile.size,
            designFileName: "design.pdf",
            designFileSize: designFile.size,
            extraPrompt: "Focus on safety",
            styleUrl: "https://example.com/style",
          },
          reference,
          design,
          facts,
        },
      },
      {
        role: "assistant",
        content: deck,
      },
    ])
  })

  test("stores regenerated decks under independent deck IDs", () => {
    const firstDeck = deckResult("deck-first", "<html>First</html>")
    const secondDeck = deckResult("deck-second", "<html>Second</html>")

    storeDeckHistory({
      deckId: firstDeck.artifactId,
      messages: [{ role: "assistant", content: firstDeck }],
    })
    storeDeckHistory({
      deckId: secondDeck.artifactId,
      messages: [{ role: "assistant", content: secondDeck }],
    })

    expect(getGeneratedDeck("deck-first")).toEqual(firstDeck)
    expect(getGeneratedDeck("deck-second")).toEqual(secondDeck)
  })
})
