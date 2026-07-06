import type { CSSProperties } from "react"
import { useEffect, useRef } from "react"

import { SLIDE_HEIGHT, SLIDE_WIDTH } from "./constants"

type ShadowSlideProps = {
  headHtml: string
  slideHtml: string
  scale: number
  variant: "main" | "thumbnail"
  testId: string
}

export function ShadowSlide({
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

    root.innerHTML = `
      ${headHtml}
      <style>
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

        .slide-preview-frame > .slide-page {
          margin: 0 !important;
        }
      </style>
      <div class="slide-preview-frame">
        ${slideHtml}
      </div>
    `
  }, [headHtml, slideHtml])

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
