import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import type * as ReactStartModule from "@tanstack/react-start"

import type {
  AreaSelection,
  EditDeckRequest,
  GenerateDeckResult,
} from "@/server/deck-generation/types"

import { GeneratedDeckPage } from "../generated-deck-page"

const serverFunctionMocks = vi.hoisted(() => {
  const editDeckServerFn = vi.fn()
  const exportDeckPdfServerFn = vi.fn()
  const editDeckAction = vi.fn()
  const exportDeckPdfAction = vi.fn()

  return {
    editDeckServerFn,
    exportDeckPdfServerFn,
    editDeckAction,
    exportDeckPdfAction,
  }
})

vi.mock("@/server/deck-generation/api", () => ({
  editDeck: serverFunctionMocks.editDeckServerFn,
  exportDeckPdf: serverFunctionMocks.exportDeckPdfServerFn,
}))

vi.mock("@tanstack/react-start", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactStartModule>()

  return {
    ...actual,
    useServerFn: (serverFn: unknown) => {
      if (serverFn === serverFunctionMocks.editDeckServerFn) {
        return serverFunctionMocks.editDeckAction
      }

      return serverFunctionMocks.exportDeckPdfAction
    },
  }
})

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock("../components/deck-preview", () => ({
  DeckPreview: ({
    html,
    isSubmittingEdit,
    onSubmitEdit,
  }: {
    html: string
    isSubmittingEdit: boolean
    onSubmitEdit: (selections: Array<AreaSelection>) => Promise<unknown>
  }) => (
    <div>
      <div data-testid="preview-html">{html}</div>
      <div data-testid="edit-loading">
        {isSubmittingEdit ? "submitting" : "idle"}
      </div>
      <button
        type="button"
        onClick={() =>
          void onSubmitEdit([
            {
              id: "selection-one",
              slideId: "slide-1",
              order: 1,
              renderedRect: { x: 10, y: 20, width: 100, height: 120 },
              normalizedRect: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
              prompt: "  Make this concise  ",
            },
          ]).catch(() => {})
        }
      >
        Submit mocked edit
      </button>
    </div>
  ),
}))

const editDeckActionMock = serverFunctionMocks.editDeckAction as ReturnType<
  typeof vi.fn<(input: { data: EditDeckRequest }) => Promise<GenerateDeckResult>>
>
const exportDeckPdfActionMock =
  serverFunctionMocks.exportDeckPdfAction as ReturnType<
    typeof vi.fn<
      (input: {
        data: { deckHtml: string }
      }) => Promise<{ pdfBytes: Array<number> }>
    >
  >

const createObjectUrlMock = vi.fn(() => "blob:edited-deck")
const revokeObjectUrlMock = vi.fn()
const anchorClickMock = vi.fn()

describe("GeneratedDeckPage edit flow", () => {
  beforeEach(() => {
    editDeckActionMock.mockReset()
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

  test("submits selections, previews edited HTML, and exports the edited artifact", async () => {
    editDeckActionMock.mockResolvedValue(deckResult("edited-html"))
    exportDeckPdfActionMock.mockResolvedValue({ pdfBytes: [0x25, 0x50] })

    renderPage(deckResult("original-html"))

    fireEvent.click(screen.getByRole("button", { name: /submit mocked edit/i }))

    await waitFor(() => {
      expect(editDeckActionMock).toHaveBeenCalledWith({
        data: {
          deckId: "deck-one",
          currentHtml: "original-html",
          selections: [
            {
              id: "selection-one",
              slideId: "slide-1",
              order: 1,
              renderedRect: { x: 10, y: 20, width: 100, height: 120 },
              normalizedRect: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
              prompt: "Make this concise",
            },
          ],
        },
      })
    })
    expect(screen.getByTestId("preview-html").textContent).toBe("edited-html")

    fireEvent.click(screen.getByRole("button", { name: /download pdf/i }))

    await waitFor(() => {
      expect(exportDeckPdfActionMock).toHaveBeenCalledWith({
        data: { deckHtml: "edited-html" },
      })
    })
  })

  test("shows edit loading and error states", async () => {
    let rejectEdit: (error: Error) => void = () => {}
    editDeckActionMock.mockReturnValue(
      new Promise<GenerateDeckResult>((_, reject) => {
        rejectEdit = reject
      })
    )

    renderPage(deckResult("original-html"))

    fireEvent.click(screen.getByRole("button", { name: /submit mocked edit/i }))

    await screen.findByText("submitting")

    rejectEdit(new Error("Mock edit failed."))

    const alert = await screen.findByRole("alert")

    expect(alert.textContent).toContain("Mock edit failed.")
  })
})

function renderPage(deck: GenerateDeckResult) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <GeneratedDeckPage deck={deck} />
    </QueryClientProvider>
  )
}

function deckResult(deckHtml: string): GenerateDeckResult {
  return {
    artifactId: "deck-one",
    deckHtml,
    slideCount: 2,
    sourceSummary: {
      referenceFileName: "reference.pdf",
      designFileName: "design.pdf",
      extraPrompt: "",
      styleUrl: "",
      provider: "test-provider",
    },
  }
}
