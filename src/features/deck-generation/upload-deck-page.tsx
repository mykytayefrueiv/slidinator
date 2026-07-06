import { useMutation } from "@tanstack/react-query"
import { useServerFn } from "@tanstack/react-start"
import {
  AlertCircle,
  Download,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react"
import type { FormEvent } from "react"
import { useState } from "react"

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
import { DeckPreview } from "./components/deck-preview"

export function UploadDeckPage() {
  const [referencePdf, setReferencePdf] = useState<File | null>(null)
  const [designPdf, setDesignPdf] = useState<File | null>(null)
  const [extraPrompt, setExtraPrompt] = useState("")
  const [styleUrl, setStyleUrl] = useState("")
  const [validationError, setValidationError] = useState("")
  const generateDeckServerFn = useServerFn(generateDeck)
  const exportDeckPdfServerFn = useServerFn(exportDeckPdf)

  const generateMutation = useMutation({
    mutationFn: (formData: FormData) =>
      generateDeckServerFn({ data: formData }),
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

  const errorMessage =
    validationError ||
    (generateMutation.error instanceof Error
      ? generateMutation.error.message
      : "") ||
    (exportPdfMutation.error instanceof Error
      ? exportPdfMutation.error.message
      : "")
  const result = generateMutation.data

  if (result) {
    return (
      <main className="grid min-h-svh place-items-center bg-[#f6f8f7] p-4 text-slate-950 lg:p-6">
        <section className="flex h-[calc(100svh-32px)] w-full max-w-[1360px] min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:h-[calc(100svh-48px)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
                Shadow DOM preview
              </p>
              <h1 className="mt-1 text-xl font-semibold text-slate-950">
                Generated HTML deck
              </h1>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              {result.slideCount} generated slides
            </span>
            <Button
              type="button"
              className="bg-emerald-700 hover:bg-emerald-800"
              disabled={exportPdfMutation.isPending}
              onClick={() => exportPdfMutation.mutate(result.deckHtml)}
            >
              {exportPdfMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Download />
              )}
              {exportPdfMutation.isPending ? "Exporting" : "Download PDF"}
            </Button>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="mb-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <div className="min-h-0 flex-1">
            <DeckPreview html={result.deckHtml} />
          </div>
        </section>
      </main>
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

            {errorMessage ? (
              <div
                role="alert"
                className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : null}
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

function FileInput({
  id,
  label,
  description,
  file,
  onChange,
}: {
  id: string
  label: string
  description: string
  file: File | null
  onChange: (file: File | null) => void
}) {
  return (
    <label
      htmlFor={id}
      className="grid cursor-pointer gap-3 rounded-lg border border-slate-300 bg-slate-50 p-4 transition hover:border-emerald-500 hover:bg-emerald-50/40"
    >
      <span className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-emerald-700 shadow-sm">
          <FileText className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-900">
            {label}
          </span>
          <span className="block text-xs leading-5 text-slate-600">
            {description}
          </span>
          <span className="mt-2 block truncate text-sm font-medium text-emerald-800">
            {file ? file.name : "Choose a PDF"}
          </span>
        </span>
      </span>
      <input
        id={id}
        name={id}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  )
}
