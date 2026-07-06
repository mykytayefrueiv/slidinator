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

import { UploadDeckPage } from "../upload-deck-page"

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
    typeof vi.fn<
      (input: { data: FormData }) => Promise<GenerateDeckResult | void>
    >
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
    let resolveMutation: () => void = () => {}
    generateDeckActionMock.mockReturnValue(
      new Promise<void>((resolve) => {
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

    resolveMutation()
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

  test("stays on the upload form while the server function handles redirect", async () => {
    generateDeckActionMock.mockResolvedValue(mockDeckResult())
    renderPage()
    uploadRequiredFiles()
    fireEvent.change(screen.getByLabelText("Extra prompt"), {
      target: { value: "Remember this prompt." },
    })
    fireEvent.change(screen.getByLabelText("Optional style URL"), {
      target: { value: "https://example.com/style" },
    })

    fireEvent.click(screen.getByRole("button", { name: /^generate$/i }))

    await waitFor(() => {
      expect(generateDeckActionMock).toHaveBeenCalled()
    })
    expect(screen.queryByRole("button", { name: /download pdf/i })).toBeNull()
    expect(screen.getByLabelText("Extra prompt")).toHaveProperty(
      "value",
      "Remember this prompt."
    )
    expect(screen.getByLabelText("Optional style URL")).toHaveProperty(
      "value",
      "https://example.com/style"
    )
  })
})
