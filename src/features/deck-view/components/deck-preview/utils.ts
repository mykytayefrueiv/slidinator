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
    headHtml: headElement ? serialize(headElement) : "",
    slides,
  }
}
