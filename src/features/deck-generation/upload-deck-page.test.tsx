import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import type { GenerateDeckResult } from "@/server/deck-generation/types"
import type * as ReactStartModule from "@tanstack/react-start"

import { UploadDeckPage } from "./upload-deck-page"

const serverFunctionMocks = vi.hoisted(() => {
  const generateDeckServerFn = vi.fn()
  const exportDeckPdfServerFn = vi.fn()
  const generateDeckAction = vi.fn()
  const exportDeckPdfAction = vi.fn()

  return {
    generateDeckServerFn,
    exportDeckPdfServerFn,
    generateDeckAction,
    exportDeckPdfAction,
  }
})

vi.mock("@/server/deck-generation/api", () => ({
  generateDeck: serverFunctionMocks.generateDeckServerFn,
  exportDeckPdf: serverFunctionMocks.exportDeckPdfServerFn,
}))

vi.mock("@tanstack/react-start", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactStartModule>()

  return {
    ...actual,
    useServerFn: (serverFn: unknown) => {
      if (serverFn === serverFunctionMocks.generateDeckServerFn) {
        return serverFunctionMocks.generateDeckAction
      }

      return serverFunctionMocks.exportDeckPdfAction
    },
  }
})

const generateDeckActionMock =
  serverFunctionMocks.generateDeckAction as ReturnType<
    typeof vi.fn<(input: { data: FormData }) => Promise<GenerateDeckResult>>
  >
const exportDeckPdfActionMock =
  serverFunctionMocks.exportDeckPdfAction as ReturnType<
    typeof vi.fn<
      (input: {
        data: { deckHtml: string }
      }) => Promise<{ pdfBytes: Array<number> }>
    >
  >
const createObjectUrlMock = vi.fn(() => "blob:slidinator-deck")
const revokeObjectUrlMock = vi.fn()
const anchorClickMock = vi.fn()

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <UploadDeckPage />
    </QueryClientProvider>
  )
}

function pdfFile(name: string) {
  return new File(["%PDF-1.7"], name, { type: "application/pdf" })
}

function uploadRequiredFiles() {
  fireEvent.change(screen.getByLabelText(/Reference PDF/), {
    target: { files: [pdfFile("reference.pdf")] },
  })
  fireEvent.change(screen.getByLabelText(/Design PDF/), {
    target: { files: [pdfFile("design.pdf")] },
  })
}

function mockDeckResult({
  artifactId = "mock-test",
  slideCount = 3,
  firstSlideText = "One",
  secondSlideText = "Two",
  thirdSlideText = "Three",
}: Partial<{
  artifactId: string
  slideCount: number
  firstSlideText: string
  secondSlideText: string
  thirdSlideText: string
}> = {}): GenerateDeckResult {
  return {
    artifactId,
    slideCount,
    sourceSummary: {
      referenceFileName: "reference.pdf",
      designFileName: "design.pdf",
      extraPrompt: "Focus on safety",
      styleUrl: "https://example.com",
    },
    deckHtml: `<!doctype html>
<html>
  <head>
    <style>
      @page { size: 1280px 720px; margin: 0; }
      .slide-page { width: 1280px; height: 720px; break-after: page; }
    </style>
  </head>
  <body>
    <section class="slide-page">${firstSlideText}</section>
    <section class="slide-page">${secondSlideText}</section>
    <section class="slide-page">${thirdSlideText}</section>
  </body>
</html>`,
  }
}

describe("upload-to-preview skeleton", () => {
  beforeEach(() => {
    generateDeckActionMock.mockReset()
    exportDeckPdfActionMock.mockReset()
    createObjectUrlMock.mockClear()
    revokeObjectUrlMock.mockClear()
    anchorClickMock.mockClear()
    URL.createObjectURL = createObjectUrlMock
    URL.revokeObjectURL = revokeObjectUrlMock
    HTMLAnchorElement.prototype.click = anchorClickMock
  })

  afterEach(() => {
    cleanup()
  })

  test("renders the basic generation form", () => {
    renderPage()

    expect(screen.getByLabelText(/Reference PDF/)).toBeTruthy()
    expect(screen.getByLabelText(/Design PDF/)).toBeTruthy()
    expect(screen.getByLabelText("Extra prompt")).toBeTruthy()
    expect(screen.getByLabelText("Optional style URL")).toBeTruthy()
    expect(screen.getByRole("button", { name: /generate/i })).toBeTruthy()
  })

  test("prevents submission until both PDFs are selected", () => {
    renderPage()

    fireEvent.click(screen.getByRole("button", { name: /generate/i }))

    expect(
      screen.getByText("Upload both PDFs before generating a deck.")
    ).toBeTruthy()
    expect(generateDeckActionMock).not.toHaveBeenCalled()
  })

  test("shows mutation loading state", async () => {
    let resolveMutation: (result: GenerateDeckResult) => void = () => {}
    generateDeckActionMock.mockReturnValue(
      new Promise<GenerateDeckResult>((resolve) => {
        resolveMutation = resolve
      })
    )
    renderPage()
    uploadRequiredFiles()

    fireEvent.click(screen.getByRole("button", { name: /generate/i }))

    const generatingButton = await screen.findByRole("button", {
      name: /generating/i,
    })

    expect(generatingButton).toBeTruthy()

    resolveMutation(mockDeckResult())
  })

  test("submits files and prompt inputs to the generation route", async () => {
    generateDeckActionMock.mockResolvedValue(mockDeckResult())
    renderPage()
    uploadRequiredFiles()
    fireEvent.change(screen.getByLabelText("Extra prompt"), {
      target: { value: "Focus on renal dosing." },
    })
    fireEvent.change(screen.getByLabelText("Optional style URL"), {
      target: { value: "https://example.com/style" },
    })

    fireEvent.click(screen.getByRole("button", { name: /generate/i }))

    await waitFor(() => {
      expect(generateDeckActionMock).toHaveBeenCalled()
    })

    const submittedFormData = generateDeckActionMock.mock.calls[0]?.[0].data

    expect(submittedFormData.get("referencePdf")).toMatchObject({
      name: "reference.pdf",
    })
    expect(submittedFormData.get("designPdf")).toMatchObject({
      name: "design.pdf",
    })
    expect(submittedFormData.get("extraPrompt")).toBe("Focus on renal dosing.")
    expect(submittedFormData.get("styleUrl")).toBe("https://example.com/style")
  })

  test("shows mutation error state", async () => {
    generateDeckActionMock.mockRejectedValue(
      new Error("Mock generation failed.")
    )
    renderPage()
    uploadRequiredFiles()

    fireEvent.click(screen.getByRole("button", { name: /generate/i }))

    const alert = await screen.findByRole("alert")

    expect(alert.textContent).toContain("Mock generation failed.")
  })

  test("renders a successful deck into a Shadow DOM preview", async () => {
    generateDeckActionMock.mockResolvedValue(mockDeckResult())
    renderPage()
    uploadRequiredFiles()

    fireEvent.click(screen.getByRole("button", { name: /generate/i }))

    expect(await screen.findByText("3 generated slides")).toBeTruthy()
    expect(screen.getByLabelText(/Reference PDF/)).toBeTruthy()
    expect(screen.getByLabelText(/Design PDF/)).toBeTruthy()

    const previewHost = screen.getByTestId("deck-preview-host")

    await waitFor(() => {
      expect(previewHost.shadowRoot).toBeTruthy()
      expect(
        previewHost.shadowRoot?.querySelectorAll(".slide-page").length
      ).toBe(1)
      expect(previewHost.shadowRoot?.textContent).toContain("One")
    })

    expect(screen.getByTestId("deck-thumbnail-1").shadowRoot).toBeTruthy()
    expect(screen.getByTestId("deck-thumbnail-2").shadowRoot).toBeTruthy()
    expect(screen.getByTestId("deck-thumbnail-3").shadowRoot).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }))

    await waitFor(() => {
      expect(previewHost.shadowRoot?.textContent).toContain("Two")
    })

    fireEvent.click(screen.getByRole("button", { name: "Show slide 3" }))

    await waitFor(() => {
      expect(previewHost.shadowRoot?.textContent).toContain("Three")
    })
  })

  test("downloads the generated deck PDF from the preview", async () => {
    const result = mockDeckResult()
    generateDeckActionMock.mockResolvedValue(result)
    exportDeckPdfActionMock.mockResolvedValue({
      pdfBytes: [0x25, 0x50, 0x44, 0x46],
    })
    renderPage()
    uploadRequiredFiles()

    fireEvent.click(screen.getByRole("button", { name: /generate/i }))

    const downloadButton = await screen.findByRole("button", {
      name: /download pdf/i,
    })

    fireEvent.click(downloadButton)

    await waitFor(() => {
      expect(exportDeckPdfActionMock.mock.calls[0]?.[0]).toEqual({
        data: { deckHtml: result.deckHtml },
      })
    })
    expect(createObjectUrlMock).toHaveBeenCalled()
    expect(anchorClickMock).toHaveBeenCalled()
    expect(revokeObjectUrlMock).toHaveBeenCalledWith("blob:slidinator-deck")
  })

  test("shows export loading and error states", async () => {
    generateDeckActionMock.mockResolvedValue(mockDeckResult())
    let rejectExport: (error: Error) => void = () => {}
    exportDeckPdfActionMock.mockReturnValue(
      new Promise((_, reject) => {
        rejectExport = reject
      })
    )
    renderPage()
    uploadRequiredFiles()

    fireEvent.click(screen.getByRole("button", { name: /generate/i }))

    const downloadButton = await screen.findByRole("button", {
      name: /download pdf/i,
    })
    fireEvent.click(downloadButton)

    expect(
      await screen.findByRole("button", { name: /exporting/i })
    ).toBeTruthy()

    rejectExport(new Error("Mock export failed."))

    const alert = await screen.findByRole("alert")

    expect(alert.textContent).toContain("Mock export failed.")
  })

  test("regenerating replaces the preview and PDF download source", async () => {
    let resolveRegeneration: (result: GenerateDeckResult) => void = () => {}
    const firstResult = mockDeckResult({
      artifactId: "first-artifact",
      firstSlideText: "Original deck",
    })
    const secondResult = mockDeckResult({
      artifactId: "second-artifact",
      firstSlideText: "Regenerated deck",
    })
    generateDeckActionMock
      .mockResolvedValueOnce(firstResult)
      .mockReturnValueOnce(
        new Promise<GenerateDeckResult>((resolve) => {
          resolveRegeneration = resolve
        })
      )
    exportDeckPdfActionMock.mockResolvedValue({
      pdfBytes: [0x25, 0x50, 0x44, 0x46],
    })
    renderPage()
    uploadRequiredFiles()

    fireEvent.click(screen.getByRole("button", { name: /^generate$/i }))

    const previewHost = await screen.findByTestId("deck-preview-host")

    await waitFor(() => {
      expect(previewHost.shadowRoot?.textContent).toContain("Original deck")
    })

    fireEvent.change(screen.getByLabelText("Extra prompt"), {
      target: { value: "Make the second version." },
    })
    fireEvent.click(screen.getByRole("button", { name: /regenerate deck/i }))

    expect(
      await screen.findByRole("button", { name: /regenerating/i })
    ).toBeTruthy()

    resolveRegeneration(secondResult)

    await waitFor(() => {
      expect(previewHost.shadowRoot?.textContent).toContain("Regenerated deck")
    })

    fireEvent.click(screen.getByRole("button", { name: /download pdf/i }))

    await waitFor(() => {
      expect(exportDeckPdfActionMock).toHaveBeenCalledWith({
        data: { deckHtml: secondResult.deckHtml },
      })
    })
  })
})
