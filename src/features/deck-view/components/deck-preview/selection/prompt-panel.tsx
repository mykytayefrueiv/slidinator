import { Loader2, Send, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import type { SlideSelection } from "./types"

type SelectionPromptPanelProps = {
  selections: Array<SlideSelection>
  activeSelectionId: string | null
  canSubmit: boolean
  isSubmitting: boolean
  onSelect: (selectionId: string) => void
  onPromptChange: (selectionId: string, prompt: string) => void
  onRemove: (selectionId: string) => void
  onSubmit: () => void
}

export function SelectionPromptPanel({
  selections,
  activeSelectionId,
  canSubmit,
  isSubmitting,
  onSelect,
  onPromptChange,
  onRemove,
  onSubmit,
}: SelectionPromptPanelProps) {
  if (selections.length === 0) {
    return (
      <div className="border-t border-slate-200 bg-white px-4 py-3">
        <p className="text-sm text-slate-500">
          Turn on edit mode and drag over the slide to mark areas that need
          changes.
        </p>
      </div>
    )
  }

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-800">
            Requested changes
          </h2>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {selections.length} selected
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          className="bg-emerald-700 hover:bg-emerald-800"
          disabled={!canSubmit || isSubmitting}
          onClick={onSubmit}
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          {isSubmitting ? "Submitting" : "Submit edit"}
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {selections.map((selection) => {
          const isActive = selection.id === activeSelectionId

          return (
            <article
              key={selection.id}
              className={cn(
                "rounded-lg border bg-slate-50 p-3 transition",
                isActive
                  ? "border-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.16)]"
                  : "border-slate-200"
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="flex items-center gap-2 text-left text-sm font-semibold text-slate-800"
                  onClick={() => onSelect(selection.id)}
                >
                  <span className="grid size-6 place-items-center rounded-full bg-emerald-700 text-xs text-white">
                    {selection.order}
                  </span>
                  Slide {selection.slideId.replace("slide-", "")}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove selection ${selection.order}`}
                  onClick={() => onRemove(selection.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <label className="sr-only" htmlFor={`selection-${selection.id}`}>
                Change request for selection {selection.order}
              </label>
              <Textarea
                id={`selection-${selection.id}`}
                value={selection.prompt}
                placeholder="What should change in this selected area?"
                className="min-h-20 rounded-md bg-white text-sm"
                onFocus={() => onSelect(selection.id)}
                onChange={(event) =>
                  onPromptChange(selection.id, event.target.value)
                }
              />
            </article>
          )
        })}
      </div>
    </div>
  )
}
