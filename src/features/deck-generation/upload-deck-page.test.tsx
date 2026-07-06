import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import type { GenerateDeckResult } from "@/server/deck-generation/types"

import { UploadDeckPage } from "./upload-deck-page"

const generateDeckActionMock = vi.fn<
  (formData: FormData) => Promise<GenerateDeckResult>
>()

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <UploadDeckPage generateDeckAction={generateDeckActionMock} />
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

function mockDeckResult(): GenerateDeckResult {
  return {
    artifactId: "mock-test",
    slideCount: 3,
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
    <section class="slide-page">One</section>
    <section class="slide-page">Two</section>
    <section class="slide-page">Three</section>
  </body>
</html>`,
  }
}

describe("upload-to-preview skeleton", () => {
  beforeEach(() => {
    generateDeckActionMock.mockReset()
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

  test("shows mutation error state", async () => {
    generateDeckActionMock.mockRejectedValue(new Error("Mock generation failed."))
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
    expect(screen.queryByLabelText(/Reference PDF/)).toBeNull()
    expect(screen.queryByLabelText(/Design PDF/)).toBeNull()

    const previewHost = screen.getByTestId("deck-preview-host")

    await waitFor(() => {
      expect(previewHost.shadowRoot).toBeTruthy()
      expect(previewHost.shadowRoot?.querySelectorAll(".slide-page").length).toBe(
        1
      )
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
})
