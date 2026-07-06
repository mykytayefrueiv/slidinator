import { beforeEach, describe, expect, test, vi } from "vitest"
import type * as SlideImageModule from "@/server/deck-generation/pdf/render-slide-images"

const screenshotMock = vi.fn()
const nthMock = vi.fn()
const countMock = vi.fn()
const locatorMock = vi.fn()
const setContentMock = vi.fn()
const emulateMediaMock = vi.fn()
const evaluateMock = vi.fn()
const newPageMock = vi.fn()
const closeMock = vi.fn()
const launchMock = vi.fn()

vi.mock("playwright", () => ({
  chromium: {
    launch: launchMock,
  },
}))

const validDeckHtml = `<!doctype html>
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
    <section class="slide-page">Three</section>
  </body>
</html>`

describe("slide image rendering", () => {
  beforeEach(() => {
    screenshotMock.mockReset()
    nthMock.mockReset()
    countMock.mockReset()
    locatorMock.mockReset()
    setContentMock.mockReset()
    emulateMediaMock.mockReset()
    evaluateMock.mockReset()
    newPageMock.mockReset()
    closeMock.mockReset()
    launchMock.mockReset()

    screenshotMock.mockResolvedValue(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))
    nthMock.mockReturnValue({ screenshot: screenshotMock })
    countMock.mockResolvedValue(3)
    locatorMock.mockReturnValue({ count: countMock, nth: nthMock })
    setContentMock.mockResolvedValue(undefined)
    emulateMediaMock.mockResolvedValue(undefined)
    evaluateMock.mockResolvedValue(undefined)
    newPageMock.mockResolvedValue({
      setContent: setContentMock,
      emulateMedia: emulateMediaMock,
      evaluate: evaluateMock,
      locator: locatorMock,
    })
    closeMock.mockResolvedValue(undefined)
    launchMock.mockResolvedValue({
      newPage: newPageMock,
      close: closeMock,
    })
  })

  test("renders unique slide IDs derived from selections with PDF export geometry", async () => {
    const { renderSlideImagesForSelections } = await importSlideImageRenderer()

    const images = await renderSlideImagesForSelections({
      deckHtml: validDeckHtml,
      selections: [
        { slideId: "slide-2" },
        { slideId: "slide-1" },
        { slideId: "slide-2" },
      ],
    })

    expect(launchMock).toHaveBeenCalledTimes(1)
    expect(newPageMock).toHaveBeenCalledWith({
      viewport: { width: 1280, height: 720 },
    })
    expect(setContentMock).toHaveBeenCalledWith(validDeckHtml, {
      waitUntil: "networkidle",
    })
    expect(emulateMediaMock).toHaveBeenCalledWith({ media: "print" })
    expect(locatorMock).toHaveBeenCalledWith(".slide-page")
    expect(nthMock).toHaveBeenNthCalledWith(1, 1)
    expect(nthMock).toHaveBeenNthCalledWith(2, 0)
    expect(images).toEqual([
      {
        slideId: "slide-2",
        mediaType: "image/png",
        dataUrl: "data:image/png;base64,iVBORw==",
        aiContent: {
          type: "image",
          image: "data:image/png;base64,iVBORw==",
          mediaType: "image/png",
        },
      },
      {
        slideId: "slide-1",
        mediaType: "image/png",
        dataUrl: "data:image/png;base64,iVBORw==",
        aiContent: {
          type: "image",
          image: "data:image/png;base64,iVBORw==",
          mediaType: "image/png",
        },
      },
    ])
    expect(closeMock).toHaveBeenCalledTimes(1)
  })

  test("throws a clear error when the requested slide is missing", async () => {
    const { renderSlideImages } = await importSlideImageRenderer()

    await expect(
      renderSlideImages({
        deckHtml: validDeckHtml,
        slideIds: ["slide-4"],
      })
    ).rejects.toThrow(
      'Requested slide "slide-4" was not found. Deck contains 3 slide(s).'
    )
    expect(closeMock).toHaveBeenCalledTimes(1)
  })

  test("throws a clear error for invalid slide IDs", async () => {
    const { renderSlideImages } = await importSlideImageRenderer()

    await expect(
      renderSlideImages({
        deckHtml: validDeckHtml,
        slideIds: ["2"],
      })
    ).rejects.toThrow('Slide ID "2" is invalid. Expected IDs like "slide-1".')
    expect(closeMock).toHaveBeenCalledTimes(1)
  })

  test("adds selection overlays before screenshotting selection-derived slide images", async () => {
    const { renderSlideImagesForSelections } = await importSlideImageRenderer()

    await renderSlideImagesForSelections({
      deckHtml: validDeckHtml,
      selections: [
        {
          slideId: "slide-2",
          order: 3,
          normalizedRect: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
          prompt: "Make this easier to read",
        },
      ],
    })

    expect(evaluateMock).toHaveBeenCalledWith(expect.any(Function), [
      {
        id: "slide-2-3",
        slideId: "slide-2",
        order: 3,
        normalizedRect: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
      },
    ])
  })
})

async function importSlideImageRenderer() {
  const module: typeof SlideImageModule =
    await import("@/server/deck-generation/pdf/render-slide-images")

  return module
}
