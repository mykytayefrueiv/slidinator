import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useServerFn } from "@tanstack/react-start"
import { Loader2, Sparkles } from "lucide-react"
import type { FormEvent } from "react"
import { useState } from "react"

import { ErrorAlert } from "@/components/error-alert"
import { FileInput } from "@/components/file-input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { exportDeckPdf, generateDeck } from "@/server/deck-generation/api"
import type { GenerateDeckResult } from "@/server/deck-generation/types"

import { GeneratedDeckView } from "./components/generated-deck-view"

export function UploadDeckPage() {
  const queryClient = useQueryClient()
  const [referencePdf, setReferencePdf] = useState<File | null>(null)
  const [designPdf, setDesignPdf] = useState<File | null>(null)
  const [extraPrompt, setExtraPrompt] = useState("")
  const [styleUrl, setStyleUrl] = useState("")
  const [validationError, setValidationError] = useState("")
  const [generatedDeck, setGeneratedDeck] = useState<GenerateDeckResult | null>(
    null
  )
  const generateDeckServerFn = useServerFn(generateDeck)
  const exportDeckPdfServerFn = useServerFn(exportDeckPdf)

  const generateMutation = useMutation({
    mutationFn: (formData: FormData) =>
      generateDeckServerFn({ data: formData }),
    onSuccess: (result) => {
      setGeneratedDeck(result)
      exportPdfMutation.reset()
    },
  })
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError("")

    if (!referencePdf || !designPdf) {
      setValidationError("Upload both PDFs before generating a deck.")
      return
    }

    const formData = new FormData()
    formData.set("referencePdf", referencePdf)
    formData.set("designPdf", designPdf)
    formData.set("extraPrompt", extraPrompt)
    formData.set("styleUrl", styleUrl)

    generateMutation.mutate(formData)
  }

  function handleBackToStart() {
    setGeneratedDeck(null)
    setReferencePdf(null)
    setDesignPdf(null)
    setExtraPrompt("")
    setStyleUrl("")
    setValidationError("")
    generateMutation.reset()
    exportPdfMutation.reset()
    queryClient.clear()
  }

  const result = generatedDeck
  const errorMessage =
    validationError ||
    (generateMutation.error instanceof Error
      ? generateMutation.error.message
      : "") ||
    (exportPdfMutation.error instanceof Error
      ? exportPdfMutation.error.message
      : "")

  if (result) {
    return (
      <GeneratedDeckView
        deck={result}
        errorMessage={errorMessage}
        isExporting={exportPdfMutation.isPending}
        onBackToStart={handleBackToStart}
        onDownloadPdf={() => exportPdfMutation.mutate(result.deckHtml)}
      />
    )
  }

  return (
    <main className="grid min-h-svh place-items-center bg-[#f6f8f7] px-5 py-8 text-slate-950">
      <Card className="w-full max-w-[430px] gap-6 rounded-lg border-slate-200 bg-white py-6 shadow-sm">
        <CardHeader className="gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase">
              Slidinator prototype
            </p>
            <CardTitle className="mt-3 text-3xl leading-tight font-semibold text-slate-950">
              Upload PDFs, generate a pharma deck
            </CardTitle>
            <CardDescription className="mt-3 text-sm leading-6 text-slate-600">
              Extract factual content from a reference PDF, sample visual style
              from a design PDF, and generate validated HTML slides.
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-5">
            <FileInput
              id="referencePdf"
              label="Reference PDF"
              description="Source document for factual content."
              file={referencePdf}
              onChange={setReferencePdf}
            />
            <FileInput
              id="designPdf"
              label="Design PDF"
              description="Visual reference for the deck style."
              file={designPdf}
              onChange={setDesignPdf}
            />

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-800">
                Extra prompt
              </span>
              <Textarea
                value={extraPrompt}
                onChange={(event) => setExtraPrompt(event.target.value)}
                rows={4}
                className="min-h-28 resize-y rounded-lg border-slate-300 bg-white text-sm leading-6 focus-visible:border-emerald-600 focus-visible:ring-emerald-100"
                placeholder="Emphasize dosing, contraindications, or patient counseling points."
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-800">
                Optional style URL
              </span>
              <Input
                type="url"
                value={styleUrl}
                onChange={(event) => setStyleUrl(event.target.value)}
                className="h-11 rounded-lg border-slate-300 bg-white text-sm focus-visible:border-emerald-600 focus-visible:ring-emerald-100"
                placeholder="https://example.com/brand-guidelines"
              />
            </label>

            {errorMessage ? <ErrorAlert message={errorMessage} /> : null}
          </CardContent>

          <CardFooter className="mt-2 flex-col items-stretch gap-3">
            <Button
              type="submit"
              size="lg"
              className="w-full bg-emerald-700 hover:bg-emerald-800"
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Sparkles />
              )}
              {generateMutation.isPending ? "Generating" : "Generate"}
            </Button>
            <p className="text-center text-xs leading-5 text-slate-500">
              Required: both PDFs. Prompt and URL are optional.
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
