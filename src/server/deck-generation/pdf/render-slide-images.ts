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

    return await Promise.all(
      uniqueStrings(slideIds).map(async (slideId) => {
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

        return {
          slideId,
          mediaType: PNG_MEDIA_TYPE,
          dataUrl,
          aiContent: {
            type: "image",
            image: dataUrl,
            mediaType: PNG_MEDIA_TYPE,
          },
        }
      })
    )
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
      overlay.style.cssText = [
        "position: absolute",
        `left: ${rect.x * 100}%`,
        `top: ${rect.y * 100}%`,
        `width: ${rect.width * 100}%`,
        `height: ${rect.height * 100}%`,
        "box-sizing: border-box",
        "border: 4px solid #f97316",
        "background: rgba(249, 115, 22, 0.14)",
        "z-index: 2147483647",
        "pointer-events: none",
      ].join(";")

      const label = document.createElement("div")
      label.textContent = String(selection.order)
      label.style.cssText = [
        "position: absolute",
        "left: 0",
        "top: 0",
        "transform: translate(-4px, -100%)",
        "min-width: 28px",
        "height: 28px",
        "border-radius: 999px",
        "background: #f97316",
        "color: white",
        "font: 700 16px/28px Arial, sans-serif",
        "text-align: center",
      ].join(";")

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
  return [
    ...new Set(
      values.flatMap((value) => {
        const trimmedValue = value.trim()

        return trimmedValue ? [trimmedValue] : []
      })
    ),
  ]
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
