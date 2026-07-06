import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"

import { exportDeckPdf } from "@/server/deck-generation/api"
import type { GenerateDeckResult } from "@/server/deck-generation/types"

import { GeneratedDeckView } from "./components/generated-deck-view"

type GeneratedDeckPageProps = {
  deck: GenerateDeckResult
}

export function GeneratedDeckPage({ deck }: GeneratedDeckPageProps) {
  const navigate = useNavigate()
  const exportDeckPdfServerFn = useServerFn(exportDeckPdf)
  const exportPdfMutation = useMutation({
    mutationFn: (deckHtml: string) =>
      exportDeckPdfServerFn({ data: { deckHtml } }),
    onSuccess: ({ pdfBytes }) => {
      const pdfBlob = new Blob([new Uint8Array(pdfBytes)], {
        type: "application/pdf",
      })
      const objectUrl = URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")

      link.href = objectUrl
      link.download = "slidinator-deck.pdf"
      link.click()
      URL.revokeObjectURL(objectUrl)
    },
  })
  const errorMessage =
    exportPdfMutation.error instanceof Error
      ? exportPdfMutation.error.message
      : ""

  return (
    <GeneratedDeckView
      deck={deck}
      errorMessage={errorMessage}
      isExporting={exportPdfMutation.isPending}
      onBackToStart={() => navigate({ to: "/" })}
      onDownloadPdf={() => exportPdfMutation.mutate(deck.deckHtml)}
    />
  )
}
