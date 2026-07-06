import type { SelectionRect, SlideSelection } from "./types"

type Point = {
  x: number
  y: number
}

type Bounds = {
  width: number
  height: number
}

export const MIN_SELECTION_SIZE = 8

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function roundRect(rect: SelectionRect): SelectionRect {
  return {
    x: Number(rect.x.toFixed(4)),
    y: Number(rect.y.toFixed(4)),
    width: Number(rect.width.toFixed(4)),
    height: Number(rect.height.toFixed(4)),
  }
}

export function getRenderedRectFromDrag({
  start,
  current,
  bounds,
}: {
  start: Point
  current: Point
  bounds: Bounds
}): SelectionRect {
  const startX = clamp(start.x, 0, bounds.width)
  const startY = clamp(start.y, 0, bounds.height)
  const currentX = clamp(current.x, 0, bounds.width)
  const currentY = clamp(current.y, 0, bounds.height)

  return {
    x: Math.min(startX, currentX),
    y: Math.min(startY, currentY),
    width: Math.abs(currentX - startX),
    height: Math.abs(currentY - startY),
  }
}

export function normalizeRenderedRect(
  renderedRect: SelectionRect,
  bounds: Bounds
): SelectionRect {
  if (bounds.width <= 0 || bounds.height <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  return roundRect({
    x: renderedRect.x / bounds.width,
    y: renderedRect.y / bounds.height,
    width: renderedRect.width / bounds.width,
    height: renderedRect.height / bounds.height,
  })
}

export function renderNormalizedRect(
  normalizedRect: SelectionRect,
  bounds: Bounds
): SelectionRect {
  return {
    x: normalizedRect.x * bounds.width,
    y: normalizedRect.y * bounds.height,
    width: normalizedRect.width * bounds.width,
    height: normalizedRect.height * bounds.height,
  }
}

export function isDrawableSelection(rect: SelectionRect) {
  return rect.width >= MIN_SELECTION_SIZE && rect.height >= MIN_SELECTION_SIZE
}

export function createSlideSelection({
  id,
  slideId,
  order,
  renderedRect,
  bounds,
}: {
  id: string
  slideId: string
  order: number
  renderedRect: SelectionRect
  bounds: Bounds
}): SlideSelection {
  return {
    id,
    slideId,
    order,
    renderedRect,
    normalizedRect: normalizeRenderedRect(renderedRect, bounds),
    prompt: "",
  }
}

export function updateSelectionPrompt(
  selections: Array<SlideSelection>,
  selectionId: string,
  prompt: string
) {
  return selections.map((selection) =>
    selection.id === selectionId ? { ...selection, prompt } : selection
  )
}
