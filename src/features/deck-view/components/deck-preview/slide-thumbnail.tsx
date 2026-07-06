import { SLIDE_WIDTH, THUMBNAIL_WIDTH } from "./constants"
import { ShadowSlide } from "./shadow-slide"

type SlideThumbnailProps = {
  headHtml: string
  slideHtml: string
  slideNumber: number
  isActive: boolean
  onSelect: () => void
}

export function SlideThumbnail({
  headHtml,
  slideHtml,
  slideNumber,
  isActive,
  onSelect,
}: SlideThumbnailProps) {
  return (
    <button
      type="button"
      className={`relative text-left transition ${
        isActive ? "opacity-100" : "opacity-75 hover:opacity-100"
      }`}
      aria-label={`Show slide ${slideNumber}`}
      aria-current={isActive ? "true" : undefined}
      onClick={onSelect}
    >
      <span
        className={`absolute -top-2 -left-2 z-10 flex size-6 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm ${
          isActive ? "bg-emerald-700" : "bg-slate-700"
        }`}
      >
        {slideNumber}
      </span>
      <ShadowSlide
        headHtml={headHtml}
        slideHtml={slideHtml}
        scale={THUMBNAIL_WIDTH / SLIDE_WIDTH}
        variant="thumbnail"
        testId={`deck-thumbnail-${slideNumber}`}
      />
    </button>
  )
}
