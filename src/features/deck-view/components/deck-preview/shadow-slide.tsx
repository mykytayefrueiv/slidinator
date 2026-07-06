import type { CSSProperties } from "react"
import { useEffect, useRef } from "react"

import { SLIDE_HEIGHT, SLIDE_WIDTH } from "./constants"

type ShadowSlideProps = {
  bodyAttributes: string
  headHtml: string
  slideHtml: string
  scale: number
  variant: "main" | "thumbnail"
  testId: string
}

export function ShadowSlide({
  bodyAttributes,
  headHtml,
  slideHtml,
  scale,
  variant,
  testId,
}: ShadowSlideProps) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current

    if (!host) {
      return
    }

    const root = host.shadowRoot ?? host.attachShadow({ mode: "open" })
    const previewDocument = new DOMParser().parseFromString(
      `<!doctype html><html><head>${headHtml}</head><body ${bodyAttributes}>${slideHtml}</body></html>`,
      "text/html"
    )
    sanitizePreviewDocument(previewDocument)

    const previewStyles = document.createElement("style")
    previewStyles.textContent = `
        :host {
          display: block;
          overflow: hidden;
          background: #f8fafc;
        }

        .slide-preview-frame {
          width: ${SLIDE_WIDTH}px;
          height: ${SLIDE_HEIGHT}px;
          transform: scale(var(--slide-scale));
          transform-origin: top left;
        }

        .slide-preview-body {
          display: block;
          margin: 0;
          width: ${SLIDE_WIDTH}px;
          height: ${SLIDE_HEIGHT}px;
          overflow: hidden;
        }

        .slide-preview-frame > .slide-preview-body > .slide-page {
          margin: 0 !important;
        }
    `
    const previewFrame = document.createElement("div")
    const previewBody = document.importNode(previewDocument.body, false)

    previewFrame.className = "slide-preview-frame"
    previewBody.append(
      ...Array.from(previewDocument.body.childNodes, (node) =>
        document.importNode(node, true)
      )
    )
    root.replaceChildren(
      ...Array.from(previewDocument.head.childNodes, (node) =>
        document.importNode(node, true)
      ),
      previewStyles,
      previewFrame
    )
    previewFrame.append(previewBody)
  }, [bodyAttributes, headHtml, slideHtml])

  return (
    <div
      ref={hostRef}
      data-testid={testId}
      style={
        {
          "--slide-scale": String(scale),
          height: SLIDE_HEIGHT * scale,
          width: SLIDE_WIDTH * scale,
        } as CSSProperties
      }
      className={
        variant === "thumbnail"
          ? "overflow-hidden bg-white"
          : "overflow-hidden rounded border border-slate-200 bg-white"
      }
      aria-label="Generated deck slide"
    />
  )
}

function sanitizePreviewDocument(document: Document) {
  for (const script of Array.from(document.querySelectorAll("script"))) {
    script.remove()
  }

  for (const element of Array.from(document.querySelectorAll("*"))) {
    for (const attribute of Array.from(element.attributes)) {
      if (/^on/i.test(attribute.name)) {
        element.removeAttribute(attribute.name)
      }
    }
  }
}
