import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"

import { editDeck, exportDeckPdf } from "@/server/deck-generation/api"
import type {
  AreaSelection,
  EditDeckRequest,
  GenerateDeckResult,
} from "@/server/deck-generation/types"

import { GeneratedDeckView } from "./components/generated-deck-view"

type GeneratedDeckPageProps = {
  deck: GenerateDeckResult
}

export function GeneratedDeckPage({ deck }: GeneratedDeckPageProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editedDeck, setEditedDeck] = useState<GenerateDeckResult | null>(null)
  const exportDeckPdfServerFn = useServerFn(exportDeckPdf)
  const editDeckServerFn = useServerFn(editDeck)
  const currentDeck =
    editedDeck?.artifactId === deck.artifactId ? editedDeck : deck

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
      void queryClient.invalidateQueries()
    },
  })
  const editDeckMutation = useMutation({
    mutationFn: (request: EditDeckRequest) =>
      editDeckServerFn({ data: request }),
    onSuccess: (updatedDeck) => {
      setEditedDeck(updatedDeck)
      void queryClient.invalidateQueries()
    },
  })
  const error =
    editDeckMutation.error instanceof Error
      ? editDeckMutation.error
      : exportPdfMutation.error instanceof Error
        ? exportPdfMutation.error
        : null

  return (
    <GeneratedDeckView
      deck={currentDeck}
      errorMessage={error?.message ?? ""}
      isEditing={editDeckMutation.isPending}
      isExporting={exportPdfMutation.isPending}
      onBackToStart={() => navigate({ to: "/" })}
      onDownloadPdf={() => exportPdfMutation.mutate(currentDeck.deckHtml)}
      onSubmitEdit={(selections) =>
        editDeckMutation.mutateAsync({
          deckId: currentDeck.artifactId,
          currentHtml: currentDeck.deckHtml,
          selections: selections.map(toAreaSelection),
        })
      }
    />
  )
}

function toAreaSelection(selection: AreaSelection): AreaSelection {
  return {
    ...selection,
    prompt: selection.prompt.trim(),
  }
}
