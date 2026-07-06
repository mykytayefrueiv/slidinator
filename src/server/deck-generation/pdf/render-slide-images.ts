import { validateDeckHtml } from "../validation/html-deck-validation"

export type SlideImageSelection = {
  slideId: string
  order?: number
  normalizedRect?: {
    x: number
    y: number
    width: number
    height: number
  }
  prompt?: string
}

export type SlideImageContext = {
  slideId: string
  mediaType: "image/png"
  dataUrl: string
  aiContent: {
    type: "image"
    image: string
    mediaType: "image/png"
  }
}

export type RenderSlideImagesInput = {
  deckHtml: string
  slideIds: Array<string>
  selections?: Array<SlideImageSelection>
}

export type RenderSlideImagesForSelectionsInput = {
  deckHtml: string
  selections: Array<SlideImageSelection>
}

const SLIDE_SELECTOR = ".slide-page"
const SLIDE_WIDTH = 1280
const SLIDE_HEIGHT = 720
const PNG_MEDIA_TYPE = "image/png"

export async function renderSlideImagesForSelections({
  deckHtml,
  selections,
}: RenderSlideImagesForSelectionsInput): Promise<Array<SlideImageContext>> {
  return renderSlideImages({
    deckHtml,
    slideIds: uniqueSlideIds(selections),
    selections,
  })
}

export async function renderSlideImages({
  deckHtml,
  slideIds,
  selections = [],
}: RenderSlideImagesInput): Promise<Array<SlideImageContext>> {
  const validation = validateDeckHtml(deckHtml)

  if (!validation.valid) {
    throw new InvalidDeckHtmlForSlideImageError(validation.errors[0]?.message)
  }

  const { chromium } = await import("playwright")
  const browser = await chromium.launch()

  try {
    const page = await browser.newPage({
      viewport: { width: SLIDE_WIDTH, height: SLIDE_HEIGHT },
    })

    await page.setContent(deckHtml, { waitUntil: "networkidle" })
    await page.emulateMedia({ media: "print" })
    await addSelectionOverlays(page, selectionsForOverlay(selections))

    const slideCount = await page.locator(SLIDE_SELECTOR).count()
    const images: Array<SlideImageContext> = []

    for (const slideId of uniqueStrings(slideIds)) {
      const slideIndex = slideIndexFromId(slideId)

      if (slideIndex >= slideCount) {
        throw new SlideImageRenderError(
          `Requested slide "${slideId}" was not found. Deck contains ${slideCount} slide(s).`
        )
      }

      const imageBytes = await page
        .locator(SLIDE_SELECTOR)
        .nth(slideIndex)
        .screenshot({ type: "png" })
      const dataUrl = `data:${PNG_MEDIA_TYPE};base64,${Buffer.from(imageBytes).toString("base64")}`

      images.push({
        slideId,
        mediaType: PNG_MEDIA_TYPE,
        dataUrl,
        aiContent: {
          type: "image",
          image: dataUrl,
          mediaType: PNG_MEDIA_TYPE,
        },
      })
    }

    return images
  } finally {
    await browser.close()
  }
}

export function uniqueSlideIds(
  selections: Array<SlideImageSelection>
): Array<string> {
  return uniqueStrings(selections.map((selection) => selection.slideId))
}

async function addSelectionOverlays(
  page: {
    evaluate: (
      callback: (selections: Array<RequiredOverlaySelection>) => void,
      selections: Array<RequiredOverlaySelection>
    ) => Promise<unknown>
  },
  selections: Array<RequiredOverlaySelection>
) {
  if (selections.length === 0) {
    return
  }

  await page.evaluate((overlaySelections) => {
    const slides = Array.from(document.querySelectorAll(".slide-page"))

    for (const selection of overlaySelections) {
      const slideNumber = Number(selection.slideId.replace("slide-", ""))
      const slide = slides[slideNumber - 1]

      if (!(slide instanceof HTMLElement)) {
        continue
      }

      if (getComputedStyle(slide).position === "static") {
        slide.style.position = "relative"
      }

      const rect = selection.normalizedRect
      const overlay = document.createElement("div")
      overlay.setAttribute("data-slidinator-selection", selection.id)
      overlay.style.position = "absolute"
      overlay.style.left = `${rect.x * 100}%`
      overlay.style.top = `${rect.y * 100}%`
      overlay.style.width = `${rect.width * 100}%`
      overlay.style.height = `${rect.height * 100}%`
      overlay.style.boxSizing = "border-box"
      overlay.style.border = "4px solid #f97316"
      overlay.style.background = "rgba(249, 115, 22, 0.14)"
      overlay.style.zIndex = "2147483647"
      overlay.style.pointerEvents = "none"

      const label = document.createElement("div")
      label.textContent = String(selection.order)
      label.style.position = "absolute"
      label.style.left = "0"
      label.style.top = "0"
      label.style.transform = "translate(-4px, -100%)"
      label.style.minWidth = "28px"
      label.style.height = "28px"
      label.style.borderRadius = "999px"
      label.style.background = "#f97316"
      label.style.color = "white"
      label.style.font = "700 16px/28px Arial, sans-serif"
      label.style.textAlign = "center"

      overlay.append(label)
      slide.append(overlay)
    }
  }, selections)
}

type RequiredOverlaySelection = {
  id: string
  slideId: string
  order: number
  normalizedRect: {
    x: number
    y: number
    width: number
    height: number
  }
}

function selectionsForOverlay(
  selections: Array<SlideImageSelection>
): Array<RequiredOverlaySelection> {
  return selections.flatMap((selection, index) => {
    if (!selection.normalizedRect) {
      return []
    }

    return [
      {
        id: `${selection.slideId}-${selection.order ?? index + 1}`,
        slideId: selection.slideId,
        order: selection.order ?? index + 1,
        normalizedRect: selection.normalizedRect,
      },
    ]
  })
}

function uniqueStrings(values: Array<string>) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function slideIndexFromId(slideId: string) {
  const match = /^slide-(\d+)$/.exec(slideId)
  const slideNumber = match ? Number(match[1]) : Number.NaN

  if (!Number.isInteger(slideNumber) || slideNumber < 1) {
    throw new SlideImageRenderError(
      `Slide ID "${slideId}" is invalid. Expected IDs like "slide-1".`
    )
  }

  return slideNumber - 1
}

export class InvalidDeckHtmlForSlideImageError extends Error {
  constructor(
    message = "Deck HTML is invalid and cannot be rendered for image context."
  ) {
    super(message)
    this.name = "InvalidDeckHtmlForSlideImageError"
  }
}

export class SlideImageRenderError extends Error {
  constructor(message = "Failed to render slide image context.") {
    super(message)
    this.name = "SlideImageRenderError"
  }
}
