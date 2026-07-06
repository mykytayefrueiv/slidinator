import { parse, serialize, serializeOuter } from "parse5"
import type { DefaultTreeAdapterMap } from "parse5"

type ElementNode = DefaultTreeAdapterMap["element"]
type ParentNode = DefaultTreeAdapterMap["parentNode"]

function isElementNode(
  node: DefaultTreeAdapterMap["node"]
): node is ElementNode {
  return "tagName" in node
}

function findElementByTagName(parent: ParentNode, tagName: string) {
  return parent.childNodes.find(
    (node): node is ElementNode =>
      isElementNode(node) && node.tagName.toLowerCase() === tagName
  )
}

function hasClassName(element: ElementNode, className: string) {
  const classAttribute = element.attrs.find(
    (attribute) => attribute.name === "class"
  )

  return classAttribute?.value.split(/\s+/).includes(className) ?? false
}

function findElementsByClassName(
  parent: ParentNode,
  className: string
): Array<ElementNode> {
  return parent.childNodes.flatMap((node) => {
    if (!isElementNode(node)) {
      return []
    }

    const matches = hasClassName(node, className) ? [node] : []

    return [...matches, ...findElementsByClassName(node, className)]
  })
}

function escapeAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

function serializeAttributes(
  element: ElementNode | null,
  extraClassName?: string
) {
  if (!element || element.attrs.length === 0) {
    return extraClassName ? `class="${escapeAttribute(extraClassName)}"` : ""
  }

  const attributes = element.attrs.map((attribute) => {
    if (attribute.name === "class" && extraClassName) {
      return {
        ...attribute,
        value: [attribute.value, extraClassName].filter(Boolean).join(" "),
      }
    }

    return attribute
  })

  if (
    extraClassName &&
    !attributes.some((attribute) => attribute.name === "class")
  ) {
    attributes.push({ name: "class", value: extraClassName })
  }

  return attributes
    .map(
      (attribute) => `${attribute.name}="${escapeAttribute(attribute.value)}"`
    )
    .join(" ")
}

function adaptDocumentCssForShadowDom(headHtml: string) {
  return headHtml.replaceAll(":root", ":host")
}

export function parseDeckHtml(html: string) {
  const parsedHtml = parse(html)
  const htmlElement = findElementByTagName(parsedHtml, "html")
  const headElement = htmlElement
    ? findElementByTagName(htmlElement, "head")
    : null
  const bodyElement = htmlElement
    ? findElementByTagName(htmlElement, "body")
    : null
  const slideElements = bodyElement
    ? findElementsByClassName(bodyElement, "slide-page")
    : []
  const slides =
    slideElements.length > 0
      ? slideElements.map((slide) => serializeOuter(slide))
      : [bodyElement ? serialize(bodyElement) : html]

  return {
    bodyAttributes: serializeAttributes(
      bodyElement ?? null,
      "slide-preview-body"
    ),
    headHtml: headElement
      ? adaptDocumentCssForShadowDom(serialize(headElement))
      : "",
    slides,
  }
}
