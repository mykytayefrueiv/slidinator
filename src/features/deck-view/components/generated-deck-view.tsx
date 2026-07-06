import { ArrowLeft, Download, Loader2 } from "lucide-react"

import { ErrorAlert } from "@/components/error-alert"
import { Button } from "@/components/ui/button"
import type {
  AreaSelection,
  GenerateDeckResult,
} from "@/server/deck-generation/types"

import { DeckPreview } from "./deck-preview"

type GeneratedDeckViewProps = {
  deck: GenerateDeckResult
  errorMessage: string
  isEditing: boolean
  isExporting: boolean
  onBackToStart: () => void
  onDownloadPdf: () => void
  onSubmitEdit: (selections: Array<AreaSelection>) => Promise<unknown>
}

export function GeneratedDeckView({
  deck,
  errorMessage,
  isEditing,
  isExporting,
  onBackToStart,
  onDownloadPdf,
  onSubmitEdit,
}: GeneratedDeckViewProps) {
  return (
    <main className="grid min-h-svh place-items-center bg-[#f6f8f7] p-4 text-slate-950 lg:p-6">
      <section className="flex h-[calc(100svh-32px)] w-full max-w-[1480px] min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:h-[calc(100svh-48px)]">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <Button type="button" variant="outline" onClick={onBackToStart}>
                <ArrowLeft />
                Back
              </Button>
              <div>
                <h1 className="mt-1 text-xl font-semibold text-slate-950">
                  Generated HTML deck
                </h1>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              {deck.slideCount} generated slides
            </span>
            <Button
              type="button"
              className="bg-emerald-700 hover:bg-emerald-800"
              disabled={isExporting}
              onClick={onDownloadPdf}
            >
              {isExporting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Download />
              )}
              {isExporting ? "Exporting" : "Download PDF"}
            </Button>
          </div>

          {errorMessage ? (
            <ErrorAlert message={errorMessage} className="mb-4" />
          ) : null}

          <div className="min-h-0 flex-1">
            <DeckPreview
              html={deck.deckHtml}
              isSubmittingEdit={isEditing}
              onSubmitEdit={onSubmitEdit}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
