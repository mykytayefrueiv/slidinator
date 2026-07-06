import { beforeEach, describe, expect, test, vi } from "vitest"

import { editDeck } from "../edit-deck"
import {
  clearDeckHistoryForTests,
  getDeckHistory,
  getGeneratedDeck,
  storeDeckHistory,
} from "../history-store"
import type { DeckGenerationModel } from "../ai/openrouter-deck-generation-model"
import type { EditDeckRequest, GenerateDeckResult } from "../types"

const { renderSlideImagesForSelectionsMock } = vi.hoisted(() => ({
  renderSlideImagesForSelectionsMock: vi.fn(),
}))

vi.mock("../pdf/render-slide-images", () => ({
  renderSlideImagesForSelections: renderSlideImagesForSelectionsMock,
}))

const originalHtml = validDeckHtml("Original")
const editedHtml = validDeckHtml("Edited")

function validDeckHtml(label: string) {
  return `<!doctype html>
<html>
  <head>
    <style>
      @page { size: 1280px 720px; margin: 0; }
      .slide-page { width: 1280px; height: 720px; break-after: page; }
    </style>
  </head>
  <body>
    <section class="slide-page">${label} one</section>
    <section class="slide-page">${label} two</section>
  </body>
</html>`
}

function deckResult(deckHtml: string): GenerateDeckResult {
  return {
    artifactId: "deck-one",
    deckHtml,
    slideCount: 2,
    sourceSummary: {
      referenceFileName: "reference.pdf",
      designFileName: "design.pdf",
      extraPrompt: "",
      styleUrl: "",
      provider: "initial-provider",
    },
  }
}

const request: EditDeckRequest = {
  deckId: "deck-one",
  currentHtml: originalHtml,
  selections: [
    {
      id: "selection-one",
      slideId: "slide-2",
      order: 1,
      renderedRect: { x: 128, y: 72, width: 300, height: 200 },
      normalizedRect: { x: 0.1, y: 0.1, width: 0.25, height: 0.3 },
      prompt: "Make this claim clearer",
    },
  ],
}

describe("editDeck", () => {
  beforeEach(() => {
    clearDeckHistoryForTests()
    renderSlideImagesForSelectionsMock.mockReset()
    renderSlideImagesForSelectionsMock.mockResolvedValue([
      {
        slideId: "slide-2",
        mediaType: "image/png",
        dataUrl: "data:image/png;base64,slide-two",
      },
    ])
    storeDeckHistory({
      deckId: "deck-one",
      messages: [{ role: "assistant", content: deckResult(originalHtml) }],
    })
  })

  test("renders selection images internally, edits the current deck, and appends history", async () => {
    const model = modelStub({ editResult: editedHtml })

    const result = await editDeck(request, model)

    expect(renderSlideImagesForSelectionsMock).toHaveBeenCalledWith({
      deckHtml: originalHtml,
      selections: request.selections,
    })
    expect(model.editDeckHtml).toHaveBeenCalledWith({
      ...request,
      slideImages: [
        {
          slideId: "slide-2",
          mimeType: "image/png",
          data: "data:image/png;base64,slide-two",
        },
      ],
    })
    expect(result).toMatchObject({
      artifactId: "deck-one",
      deckHtml: editedHtml,
      slideCount: 2,
      sourceSummary: { provider: "test-provider" },
    })
    expect(getGeneratedDeck("deck-one")?.deckHtml).toBe(editedHtml)
    expect(getDeckHistory("deck-one")).toHaveLength(3)
    expect(getDeckHistory("deck-one")?.[1]).toMatchObject({
      role: "user",
      content: {
        kind: "edit",
        deckId: "deck-one",
        selections: request.selections,
        slideImages: [
          {
            slideId: "slide-2",
            mimeType: "image/png",
            data: "data:image/png;base64,slide-two",
          },
        ],
      },
    })
  })

  test("runs one repair path when edited HTML fails validation", async () => {
    const model = modelStub({
      editResult: "<html><body>broken</body></html>",
      repairResult: editedHtml,
    })

    await expect(editDeck(request, model)).resolves.toMatchObject({
      deckHtml: editedHtml,
    })
    expect(model.repairDeckHtml).toHaveBeenCalledWith(
      expect.objectContaining({
        invalidHtml: "<html><body>broken</body></html>",
      })
    )
  })

  test("returns a clear error for unknown deck IDs", async () => {
    const model = modelStub({ editResult: editedHtml })

    await expect(
      editDeck({ ...request, deckId: "missing-deck" }, model)
    ).rejects.toThrow(
      "Generated deck history was not found. In-memory prototype history is cleared when the server restarts."
    )
    expect(model.editDeckHtml).not.toHaveBeenCalled()
  })

  test("rejects stale HTML for the current deck workspace", async () => {
    const model = modelStub({ editResult: editedHtml })

    await expect(
      editDeck({ ...request, currentHtml: validDeckHtml("Stale") }, model)
    ).rejects.toThrow(
      "Edit request HTML is out of date for this deck. Refresh the deck before editing."
    )
    expect(model.editDeckHtml).not.toHaveBeenCalled()
  })
})

function modelStub({
  editResult,
  repairResult = editedHtml,
}: {
  editResult: string
  repairResult?: string
}): DeckGenerationModel {
  return {
    providerName: "test-provider",
    extractFacts: vi.fn(),
    composeDeckHtml: vi.fn(),
    editDeckHtml: vi.fn().mockResolvedValue(editResult),
    repairDeckHtml: vi.fn().mockResolvedValue(repairResult),
  }
}
