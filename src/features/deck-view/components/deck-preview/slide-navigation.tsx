import { ChevronLeft, ChevronRight } from "lucide-react"

type SlideNavigationProps = {
  activeSlideIndex: number
  slideCount: number
  onPrevious: () => void
  onNext: () => void
}

export function SlideNavigation({
  activeSlideIndex,
  slideCount,
  onPrevious,
  onNext,
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
