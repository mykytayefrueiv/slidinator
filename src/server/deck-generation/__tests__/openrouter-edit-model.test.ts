import { beforeEach, describe, expect, test, vi } from "vitest"

const generateTextMock = vi.fn()
const modelMock = vi.fn((modelId: string) => ({ modelId }))

vi.mock("ai", () => ({
  generateObject: vi.fn(),
  generateText: generateTextMock,
}))

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => modelMock),
}))

const currentHtml = `<!doctype html>
<html>
  <head>
    <style>
      @page { size: 1280px 720px; margin: 0; }
      .slide-page { width: 1280px; height: 720px; break-after: page; }
    </style>
  </head>
  <body>
    <section class="slide-page">One</section>
    <section class="slide-page">Two</section>
  </body>
</html>`

describe("OpenRouter deck edit model", () => {
  beforeEach(() => {
    vi.resetModules()
    generateTextMock.mockReset()
    modelMock.mockClear()
    process.env.OPENROUTER_API_KEY = "test-key"
    process.env.OPENROUTER_MODEL = "test-model"
    generateTextMock.mockResolvedValue({ text: currentHtml })
  })

  test("calls AI SDK with text plus slide image file content parts", async () => {
    const { createOpenRouterDeckGenerationModel } =
      await import("../ai/openrouter-deck-generation-model")

    const model = createOpenRouterDeckGenerationModel()
    const result = await model.editDeckHtml({
      deckId: "deck-one",
      currentHtml,
      selections: [
        {
          id: "selection-one",
          slideId: "slide-1",
          order: 1,
          normalizedRect: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
          prompt: "Tighten this headline",
        },
      ],
      slideImages: [
        {
          slideId: "slide-1",
          mimeType: "image/png",
          data: "data:image/png;base64,abc",
        },
      ],
    })

    expect(result).toBe(currentHtml)
    expect(generateTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: { modelId: "test-model" },
        system: expect.stringContaining("Return raw HTML only"),
        messages: [
          {
            role: "user",
            content: [
              expect.objectContaining({
                type: "text",
                text: expect.stringContaining("Tighten this headline"),
              }),
              {
                type: "file",
                data: "data:image/png;base64,abc",
                mediaType: "image/png",
                filename: "slide-1.png",
              },
            ],
          },
        ],
        temperature: 0.2,
        maxOutputTokens: 6_000,
      })
    )
  })
})
