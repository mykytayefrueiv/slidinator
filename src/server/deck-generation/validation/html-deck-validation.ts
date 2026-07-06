import type { DefaultTreeAdapterMap } from "parse5"
import { parse } from "parse5"

import type { DeckValidationError, DeckValidationResult } from "../types"

type Parse5Node = DefaultTreeAdapterMap["node"]
type Parse5Element = DefaultTreeAdapterMap["element"]

const SLIDE_CLASS = "slide-page"

export function validateDeckHtml(html: string): DeckValidationResult {
  const errors: Array<DeckValidationError> = []
  const parseErrors: Array<{ code: string; line: number; column: number }> = []
  const document = parse(html, {
    onParseError: (error) => {
      parseErrors.push({
        code: error.code,
        line: error.startLine,
        column: error.startCol,
      })
    },
  })

  for (const parseError of parseErrors) {
    errors.push({
      code: "html-parse-error",
      message: `HTML parser reported ${parseError.code}.`,
      details: parseError,
    })
  }

  const elements = collectElements(document)
  const slideElements = elements.filter((element) =>
    classList(element).includes(SLIDE_CLASS)
  )
  const slideCount = slideElements.length

  if (slideCount === 0) {
    errors.push({
      code: "missing-slide-page",
      message: "Deck HTML must include sections with the .slide-page class.",
      details: { expectedSelector: ".slide-page" },
    })
  } else if (slideCount < 2 || slideCount > 3) {
    errors.push({
      code: "wrong-slide-count",
      message: "Deck HTML must include exactly 2 or 3 .slide-page sections.",
      details: { expectedMinimum: 2, expectedMaximum: 3, actual: slideCount },
    })
  }

  const styleTexts = []

  for (const element of elements) {
    if (element.tagName === "style") {
      styleTexts.push(textContent(element))
    }
  }

  const styleText = styleTexts.join("\n")

  if (!hasDeterministicPrintCss(styleText)) {
    errors.push({
      code: "missing-print-css",
      message:
        "Deck HTML must define deterministic print CSS with @page size 1280px 720px and margin 0.",
      details: { requiredRule: "@page { size: 1280px 720px; margin: 0; }" },
    })
  }

  if (!hasSlidePageBreakCss(styleText)) {
    errors.push({
      code: "missing-page-breaks",
      message:
        "Deck HTML must define page breaks for .slide-page using break-after: page or page-break-after: always.",
      details: {
        requiredSelector: ".slide-page",
        acceptedProperties: "break-after: page, page-break-after: always",
      },
    })
  }

  for (const element of elements) {
    if (element.tagName === "script") {
      errors.push({
        code: "script-tag-not-allowed",
        message: "Deck HTML must not include script tags.",
        details: { tagName: "script" },
      })
    }

    for (const attribute of element.attrs) {
      if (/^on/i.test(attribute.name)) {
        errors.push({
          code: "inline-event-handler-not-allowed",
          message: "Deck HTML must not include inline event handlers.",
          details: {
            tagName: element.tagName,
            attributeName: attribute.name,
          },
        })
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, slideCount, errors }
  }

  return { valid: true, slideCount, errors: [] }
}

function collectElements(node: Parse5Node): Array<Parse5Element> {
  const elements: Array<Parse5Element> = []

  if (isElement(node)) {
    elements.push(node)
  }

  if ("childNodes" in node) {
    for (const childNode of node.childNodes) {
      elements.push(...collectElements(childNode))
    }
  }

  return elements
}

function isElement(node: Parse5Node): node is Parse5Element {
  return "tagName" in node
}

function classList(element: Parse5Element) {
  const classAttribute = element.attrs.find(
    (attribute) => attribute.name === "class"
  )

  return classAttribute?.value.split(/\s+/).filter(Boolean) ?? []
}

function textContent(node: Parse5Node): string {
  if ("value" in node) {
    return node.value
  }

  if (!("childNodes" in node)) {
    return ""
  }

  return node.childNodes.map((childNode) => textContent(childNode)).join("")
}

function hasDeterministicPrintCss(css: string) {
  const pageRule = css.match(/@page\s*\{[^}]*\}/i)?.[0] ?? ""

  return (
    /size\s*:\s*1280px\s+720px\s*;?/i.test(pageRule) &&
    /margin\s*:\s*0\s*;?/i.test(pageRule)
  )
}

function hasSlidePageBreakCss(css: string) {
  const slideRuleMatches = css.match(/\.slide-page[^{]*\{[^}]*\}/gi) ?? []

  return slideRuleMatches.some(
    (rule) =>
      /break-after\s*:\s*page\s*;?/i.test(rule) ||
      /page-break-after\s*:\s*always\s*;?/i.test(rule)
  )
}
