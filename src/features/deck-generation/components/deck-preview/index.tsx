import { useEffect, useMemo, useRef, useState } from "react"

import {
  MAIN_PADDING,
  SLIDE_HEIGHT,
  SLIDE_WIDTH,
} from "./constants"
import { parseDeckHtml } from "./helpers"
import { ShadowSlide } from "./shadow-slide"
import { SlideNavigation } from "./slide-navigation"
import { SlideThumbnail } from "./slide-thumbnail"

type DeckPreviewProps = {
  html: string
}

export function DeckPreview({ html }: DeckPreviewProps) {
  const { headHtml, slides } = useMemo(() => parseDeckHtml(html), [html])
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [mainScale, setMainScale] = useState(1)
  const mainStageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = mainStageRef.current

    if (!stage) {
      return
    }

    const updateScale = (width: number, height: number) => {
      const availableWidth = width - MAIN_PADDING * 2
      const availableHeight = height - MAIN_PADDING * 2
      const nextScale = Math.min(
        1,
        Math.max(
          0.2,
          Math.min(availableWidth / SLIDE_WIDTH, availableHeight / SLIDE_HEIGHT)
        )
      )

      setMainScale(nextScale)
    }

    updateScale(stage.clientWidth || SLIDE_WIDTH, stage.clientHeight || SLIDE_HEIGHT)

    if (!("ResizeObserver" in window)) {
      return
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry) {
        updateScale(entry.contentRect.width, entry.contentRect.height)
      }
    })

    resizeObserver.observe(stage)

    return () => resizeObserver.disconnect()
  }, [])

  const activeSlide = slides[activeSlideIndex] ?? ""

  return (
    <div className="grid h-full min-h-[440px] grid-cols-[116px_1fr] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-inner">
      <div className="flex min-h-0 flex-col items-center gap-4 overflow-y-auto border-r border-slate-200 bg-white/80 px-3 py-4">
        {slides.map((slideHtml, index) => (
          <SlideThumbnail
            key={index}
            headHtml={headHtml}
            slideHtml={slideHtml}
            slideNumber={index + 1}
            isActive={activeSlideIndex === index}
            onSelect={() => setActiveSlideIndex(index)}
          />
        ))}
      </div>

      <div className="flex min-w-0 flex-col">
        <SlideNavigation
          activeSlideIndex={activeSlideIndex}
          slideCount={slides.length}
          onPrevious={() =>
            setActiveSlideIndex((index) => Math.max(0, index - 1))
          }
          onNext={() =>
            setActiveSlideIndex((index) => Math.min(slides.length - 1, index + 1))
          }
        />

        <div
          ref={mainStageRef}
          className="grid min-h-0 flex-1 place-items-center overflow-auto p-6"
        >
          <ShadowSlide
            headHtml={headHtml}
            slideHtml={activeSlide}
            scale={mainScale}
            variant="main"
            testId="deck-preview-host"
          />
        </div>
      </div>
    </div>
  )
}
