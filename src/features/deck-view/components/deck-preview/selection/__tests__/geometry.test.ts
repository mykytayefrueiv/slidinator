import { describe, expect, test } from "vitest"

import {
  createSlideSelection,
  getRenderedRectFromDrag,
  normalizeRenderedRect,
  renderNormalizedRect,
  updateSelectionPrompt,
} from "../geometry"

describe("slide selection geometry", () => {
  test("normalizes rendered rectangles relative to the slide bounds", () => {
    expect(
      normalizeRenderedRect(
        { x: 320, y: 180, width: 640, height: 360 },
        { width: 1280, height: 720 }
      )
    ).toEqual({
      x: 0.25,
      y: 0.25,
      width: 0.5,
      height: 0.5,
    })
  })

  test("renders normalized rectangles back to the current preview size", () => {
    expect(
      renderNormalizedRect(
        { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
        { width: 640, height: 360 }
      )
    ).toEqual({
      x: 160,
      y: 90,
      width: 320,
      height: 180,
    })
  })

  test("creates clamped drag rectangles in either drag direction", () => {
    expect(
      getRenderedRectFromDrag({
        start: { x: 900, y: 500 },
        current: { x: -30, y: 760 },
        bounds: { width: 1280, height: 720 },
      })
    ).toEqual({
      x: 0,
      y: 500,
      width: 900,
      height: 220,
    })
  })
})

describe("slide selection state", () => {
  test("creates a selection with rendered and normalized rectangles", () => {
    expect(
      createSlideSelection({
        id: "selection-one",
        slideId: "slide-2",
        order: 3,
        renderedRect: { x: 128, y: 72, width: 256, height: 144 },
        bounds: { width: 1280, height: 720 },
      })
    ).toEqual({
      id: "selection-one",
      slideId: "slide-2",
      order: 3,
      renderedRect: { x: 128, y: 72, width: 256, height: 144 },
      normalizedRect: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
      prompt: "",
    })
  })

  test("updates only the prompt for the requested selection", () => {
    const selections = [
      createSlideSelection({
        id: "selection-one",
        slideId: "slide-1",
        order: 1,
        renderedRect: { x: 0, y: 0, width: 100, height: 100 },
        bounds: { width: 1000, height: 1000 },
      }),
      createSlideSelection({
        id: "selection-two",
        slideId: "slide-2",
        order: 2,
        renderedRect: { x: 100, y: 100, width: 200, height: 200 },
        bounds: { width: 1000, height: 1000 },
      }),
    ]

    expect(
      updateSelectionPrompt(
        selections,
        "selection-two",
        "Make the chart title shorter."
      )
    ).toEqual([
      selections[0],
      {
        ...selections[1],
        prompt: "Make the chart title shorter.",
      },
    ])
  })
})
