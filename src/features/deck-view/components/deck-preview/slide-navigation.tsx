import { ChevronLeft, ChevronRight, SquarePen } from "lucide-react"

import { cn } from "@/lib/utils"

type SlideNavigationProps = {
  activeSlideIndex: number
  slideCount: number
  isEditMode: boolean
  onPrevious: () => void
  onNext: () => void
  onToggleEditMode: () => void
}

export function SlideNavigation({
  activeSlideIndex,
  slideCount,
  isEditMode,
  onPrevious,
  onNext,
  onToggleEditMode,
}: SlideNavigationProps) {
  const canGoPrevious = activeSlideIndex > 0
  const canGoNext = activeSlideIndex < slideCount - 1

  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-2">
      <span className="text-xs font-semibold text-slate-600">
        Slide {activeSlideIndex + 1} of {slideCount}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold shadow-sm transition",
            isEditMode
              ? "border-emerald-600 bg-emerald-700 text-white hover:bg-emerald-800"
              : "border-slate-300 bg-white text-slate-700 hover:border-emerald-500"
          )}
          aria-pressed={isEditMode}
          aria-label="Toggle edit selection mode"
          onClick={onToggleEditMode}
        >
          <SquarePen className="size-3.5" />
          Edit
        </button>
        <button
          type="button"
          className="grid size-8 place-items-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous slide"
          disabled={!canGoPrevious}
          onClick={onPrevious}
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          className="grid size-8 place-items-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next slide"
          disabled={!canGoNext}
          onClick={onNext}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
