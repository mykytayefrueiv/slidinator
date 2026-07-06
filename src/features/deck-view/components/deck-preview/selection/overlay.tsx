import type { PointerEvent } from "react"
import { useRef, useState } from "react"

import { cn } from "@/lib/utils"

import type { SelectionRect, SlideSelection } from "./types"
import {
  getRenderedRectFromDrag,
  isDrawableSelection,
  normalizeRenderedRect,
} from "./geometry"

type SelectionOverlayProps = {
  isEditMode: boolean
  slideId: string
  selections: Array<SlideSelection>
  activeSelectionId: string | null
  onSelect: (selectionId: string) => void
  onCreate: (selection: {
    slideId: string
    renderedRect: SelectionRect
    normalizedRect: SelectionRect
  }) => void
}

type DragState = {
  pointerId: number
  start: { x: number; y: number }
  current: { x: number; y: number }
}

function pointerPoint(
  event: PointerEvent<HTMLDivElement>,
  element: HTMLDivElement
) {
  const rect = element.getBoundingClientRect()

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function selectionStyle(rect: SelectionRect) {
  return {
    left: `${rect.x * 100}%`,
    top: `${rect.y * 100}%`,
    width: `${rect.width * 100}%`,
    height: `${rect.height * 100}%`,
  }
}

export function SelectionOverlay({
  isEditMode,
  slideId,
  selections,
  activeSelectionId,
  onSelect,
  onCreate,
}: SelectionOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const draftRect =
    dragState && overlayRef.current
      ? getRenderedRectFromDrag({
          start: dragState.start,
          current: dragState.current,
          bounds: {
            width: overlayRef.current.clientWidth,
            height: overlayRef.current.clientHeight,
          },
        })
      : null

  return (
    <div
      ref={overlayRef}
      className={cn(
        "absolute inset-0 touch-none",
        isEditMode ? "cursor-crosshair" : "pointer-events-none"
      )}
      aria-label="Slide selection drawing layer"
      onPointerDown={(event) => {
        if (!isEditMode || event.button !== 0 || !overlayRef.current) {
          return
        }

        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        const start = pointerPoint(event, overlayRef.current)

        setDragState({
          pointerId: event.pointerId,
          start,
          current: start,
        })
      }}
      onPointerMove={(event) => {
        if (
          !dragState ||
          dragState.pointerId !== event.pointerId ||
          !overlayRef.current
        ) {
          return
        }

        setDragState({
          ...dragState,
          current: pointerPoint(event, overlayRef.current),
        })
      }}
      onPointerUp={(event) => {
        if (
          !dragState ||
          dragState.pointerId !== event.pointerId ||
          !overlayRef.current
        ) {
          return
        }

        const bounds = {
          width: overlayRef.current.clientWidth,
          height: overlayRef.current.clientHeight,
        }
        const renderedRect = getRenderedRectFromDrag({
          start: dragState.start,
          current: pointerPoint(event, overlayRef.current),
          bounds,
        })

        if (isDrawableSelection(renderedRect)) {
          onCreate({
            slideId,
            renderedRect,
            normalizedRect: normalizeRenderedRect(renderedRect, bounds),
          })
        }

        setDragState(null)
      }}
      onPointerCancel={() => setDragState(null)}
    >
      {selections.map((selection) => {
        const isActive = selection.id === activeSelectionId

        return (
          <button
            key={selection.id}
            type="button"
            className={cn(
              "pointer-events-auto absolute rounded-[6px] border-2 bg-emerald-500/15 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.86),0_14px_30px_rgba(15,23,42,0.18)] transition",
              isActive
                ? "border-emerald-600 ring-4 ring-emerald-400/30"
                : "border-emerald-500 hover:border-emerald-700"
            )}
            style={selectionStyle(selection.normalizedRect)}
            aria-label={`Selection ${selection.order}`}
            onClick={(event) => {
              event.stopPropagation()
              onSelect(selection.id)
            }}
          >
            <span className="absolute -top-3 -left-3 grid size-6 place-items-center rounded-full border border-white bg-emerald-700 text-[11px] font-bold text-white shadow-sm">
              {selection.order}
            </span>
          </button>
        )
      })}

      {draftRect ? (
        <div
          className="absolute rounded-[6px] border-2 border-dashed border-amber-500 bg-amber-300/20 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]"
          style={{
            left: draftRect.x,
            top: draftRect.y,
            width: draftRect.width,
            height: draftRect.height,
          }}
        />
      ) : null}
    </div>
  )
}
