import { useEffect, useMemo, useRef, useState } from "react"

import { MAIN_PADDING, SLIDE_HEIGHT, SLIDE_WIDTH } from "./constants"
import {
  SelectionOverlay,
  SelectionPromptPanel,
} from "./selection"
import type { AreaSelection } from "@/server/deck-generation/types"
import type { SlideSelection } from "./selection"
import { ShadowSlide } from "./shadow-slide"
import { SlideNavigation } from "./slide-navigation"
import { SlideThumbnail } from "./slide-thumbnail"
import { parseDeckHtml } from "./utils"

type DeckPreviewProps = {
  html: string
  isSubmittingEdit?: boolean
  onSubmitEdit?: (selections: Array<AreaSelection>) => Promise<unknown>
}

export function DeckPreview({
  html,
  isSubmittingEdit = false,
  onSubmitEdit,
}: DeckPreviewProps) {
  const { bodyAttributes, headHtml, slides } = useMemo(
    () => parseDeckHtml(html),
    [html]
  )
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [mainScale, setMainScale] = useState(1)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selections, setSelections] = useState<Array<SlideSelection>>([])
  const [activeSelectionId, setActiveSelectionId] = useState<string | null>(
    null
  )
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

    updateScale(
      stage.clientWidth || SLIDE_WIDTH,
      stage.clientHeight || SLIDE_HEIGHT
    )

    if (!("ResizeObserver" in window)) {
      return
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      updateScale(entry.contentRect.width, entry.contentRect.height)
    })

    resizeObserver.observe(stage)

    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    setSelections([])
    setActiveSelectionId(null)
  }, [html])

  const activeSlide = slides[activeSlideIndex] ?? ""
  const activeSlideId = `slide-${activeSlideIndex + 1}`
  const activeSlideSelections = selections.filter(
    (selection) => selection.slideId === activeSlideId
  )
  const promptedSelections = selections.filter((selection) =>
    selection.prompt.trim()
  )
  const createSelectionId = () =>
    "selection-" + crypto.randomUUID()

  return (
    <div className="grid h-full min-h-[440px] grid-cols-[116px_1fr] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-inner">
      <div className="flex min-h-0 flex-col items-center gap-4 overflow-y-auto border-r border-slate-200 bg-white/80 px-3 py-4">
        {slides.map((slideHtml, index) => (
          <SlideThumbnail
            key={index}
            bodyAttributes={bodyAttributes}
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
          isEditMode={isEditMode}
          onPrevious={() =>
            setActiveSlideIndex((index) => Math.max(0, index - 1))
          }
          onNext={() =>
            setActiveSlideIndex((index) =>
              Math.min(slides.length - 1, index + 1)
            )
          }
          onToggleEditMode={() => setIsEditMode((enabled) => !enabled)}
        />

        <div
          ref={mainStageRef}
          className="grid min-h-0 flex-1 place-items-start justify-items-center overflow-auto p-6"
        >
          <div
            className="relative"
            style={{
              width: SLIDE_WIDTH * mainScale,
              height: SLIDE_HEIGHT * mainScale,
            }}
          >
            <ShadowSlide
              bodyAttributes={bodyAttributes}
              headHtml={headHtml}
              slideHtml={activeSlide}
              scale={mainScale}
              variant="main"
              testId="deck-preview-host"
            />
            <SelectionOverlay
              isEditMode={isEditMode}
              slideId={activeSlideId}
              selections={activeSlideSelections}
              activeSelectionId={activeSelectionId}
              onSelect={setActiveSelectionId}
              onCreate={({ slideId, renderedRect, normalizedRect }) => {
                const nextSelectionId = createSelectionId()

                setSelections((currentSelections) => {
                  const nextSelection = {
                    id: nextSelectionId,
                    slideId,
                    order: currentSelections.length + 1,
                    renderedRect,
                    normalizedRect,
                    prompt: "",
                  }

                  return [...currentSelections, nextSelection]
                })
                setActiveSelectionId(nextSelectionId)
              }}
            />
          </div>
        </div>

        <SelectionPromptPanel
          selections={selections}
          activeSelectionId={activeSelectionId}
          canSubmit={Boolean(onSubmitEdit) && promptedSelections.length > 0}
          isSubmitting={isSubmittingEdit}
          onSelect={setActiveSelectionId}
          onPromptChange={(selectionId, prompt) => {
            setSelections((currentSelections) =>
              currentSelections.map((selection) =>
                selection.id === selectionId
                  ? { ...selection, prompt }
                  : selection
              )
            )
          }}
          onRemove={(selectionId) => {
            setSelections((currentSelections) =>
              currentSelections
                .filter((selection) => selection.id !== selectionId)
                .map((selection, index) => ({
                  ...selection,
                  order: index + 1,
                }))
            )
            setActiveSelectionId((currentSelectionId) =>
              currentSelectionId === selectionId ? null : currentSelectionId
            )
          }}
          onSubmit={async () => {
            if (!onSubmitEdit || promptedSelections.length === 0) {
              return
            }

            try {
              await onSubmitEdit(
                promptedSelections.map((selection) => ({
                  ...selection,
                  prompt: selection.prompt.trim(),
                }))
              )
              setSelections([])
              setActiveSelectionId(null)
              setIsEditMode(false)
            } catch {
              // React Query owns the visible error state in the parent page.
            }
          }}
        />
      </div>
    </div>
  )
}
