import { describe, expect, test } from "vitest"

import { validateDeckHtml } from "../../validation/html-deck-validation"

function validDeckHtml(slides = 3) {
  const slideHtml = Array.from(
    { length: slides },
    (_, index) => `<section class="slide-page">Slide ${index + 1}</section>`
  ).join("")

  return `<!doctype html>
<html>
  <head>
    <style>
      @page { size: 1280px 720px; margin: 0; }
      .slide-page { width: 1280px; height: 720px; break-after: page; }
    </style>
  </head>
  <body>${slideHtml}</body>
</html>`
}

function validationCodesFor(html: string) {
  const result = validateDeckHtml(html)

  return result.errors.map((error) => error.code)
}

describe("validateDeckHtml", () => {
  test("passes valid deck HTML with 2 or 3 slide-page sections", () => {
    expect(validateDeckHtml(validDeckHtml(2))).toMatchObject({
      valid: true,
      slideCount: 2,
      errors: [],
    })
    expect(validateDeckHtml(validDeckHtml(3))).toMatchObject({
      valid: true,
      slideCount: 3,
      errors: [],
    })
  })

  test("fails when HTML has parser errors", () => {
    expect(validationCodesFor("<html><body></body></html>")).toContain(
      "html-parse-error"
    )
  })

  test("fails when slide-page sections are missing", () => {
    const html = validDeckHtml().replaceAll("slide-page", "not-a-slide")

    expect(validationCodesFor(html)).toContain("missing-slide-page")
  })

  test("fails when slide count is outside the 2-3 slide contract", () => {
    expect(validationCodesFor(validDeckHtml(1))).toContain("wrong-slide-count")
    expect(validationCodesFor(validDeckHtml(4))).toContain("wrong-slide-count")
  })

  test("fails when deterministic print CSS is missing", () => {
    const html = validDeckHtml().replace(
      "@page { size: 1280px 720px; margin: 0; }",
      ""
    )

    expect(validationCodesFor(html)).toContain("missing-print-css")
  })

  test("fails when slide-page page breaks are missing", () => {
    const html = validDeckHtml().replace("break-after: page;", "")

    expect(validationCodesFor(html)).toContain("missing-page-breaks")
  })

  test("fails when script tags are present", () => {
    const html = validDeckHtml().replace("</body>", "<script></script></body>")

    expect(validationCodesFor(html)).toContain("script-tag-not-allowed")
  })

  test("fails when inline event handlers are present", () => {
    const html = validDeckHtml().replace(
      '<section class="slide-page">',
      '<section class="slide-page" onclick="alert(1)">'
    )

    expect(validationCodesFor(html)).toContain(
      "inline-event-handler-not-allowed"
    )
  })

  test("returns structured error details for repair prompts", () => {
    const result = validateDeckHtml(validDeckHtml(1))

    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatchObject({
      code: "wrong-slide-count",
      details: { expectedMinimum: 2, expectedMaximum: 3, actual: 1 },
    })
  })
})
