import type {
  AreaSelection,
  DeckGenerationInput,
  DesignSourceMaterial,
  EditDeckModelRequest,
  FactBrief,
  GenerateDeckResult,
  ReferenceSourceMaterial,
  SlideImageInput,
} from "./types"
import { EXAMPLE_DECK_ID, exampleDeckHistory } from "./example-deck"

export type DeckGenerationHistoryContext = {
  upload: {
    referenceFileName: string
    referenceFileSize: number
    designFileName: string
    designFileSize: number
    extraPrompt: string
    styleUrl: string
  }
  reference: ReferenceSourceMaterial
  design: DesignSourceMaterial
  facts: FactBrief
}

export type DeckUserMessage = {
  role: "user"
  content: DeckGenerationHistoryContext
}

export type DeckAssistantMessage = {
  role: "assistant"
  content: GenerateDeckResult
}

export type DeckEditUserMessage = {
  role: "user"
  content: {
    kind: "edit"
    deckId: string
    currentHtml: string
    selections: Array<AreaSelection>
    slideImages: Array<SlideImageInput>
  }
}

export type DeckAiMessage =
  | DeckUserMessage
  | DeckEditUserMessage
  | DeckAssistantMessage

export type DeckHistoryStore = Partial<Record<string, Array<DeckAiMessage>>>

// Prototype-only in-memory store. It is cleared on server restart and is not
// suitable for durable history, multi-instance deployments, or production use.
const deckHistoryStore: DeckHistoryStore = {
  [EXAMPLE_DECK_ID]: exampleDeckHistory,
}

export function createDeckId() {
  return `deck-${crypto.randomUUID()}`
}

export function storeDeckHistory({
  deckId,
  messages,
}: {
  deckId: string
  messages: Array<DeckAiMessage>
}) {
  deckHistoryStore[deckId] = messages

  return deckId
}

export function storeGeneratedDeckHistory({
  input,
  reference,
  design,
  facts,
  deck,
}: {
  input: DeckGenerationInput
  reference: ReferenceSourceMaterial
  design: DesignSourceMaterial
  facts: FactBrief
  deck: GenerateDeckResult
}) {
  return storeDeckHistory({
    deckId: deck.artifactId,
    messages: [
      {
        role: "user",
        content: {
          upload: {
            referenceFileName: input.referenceFile.name,
            referenceFileSize: input.referenceFile.size,
            designFileName: input.designFile.name,
            designFileSize: input.designFile.size,
            extraPrompt: input.extraPrompt.trim(),
            styleUrl: input.styleUrl.trim(),
          },
          reference,
          design,
          facts,
        },
      },
      {
        role: "assistant",
        content: deck,
      },
    ],
  })
}

export function getDeckHistory(deckId: string) {
  return deckHistoryStore[deckId] ?? null
}

export function getGeneratedDeck(deckId: string) {
  const messages = getDeckHistory(deckId)
  const assistantMessage = messages
    ?.slice()
    .reverse()
    .find((message) => message.role === "assistant")

  return assistantMessage?.content ?? null
}

export function appendDeckEditHistory({
  deckId,
  request,
  deck,
}: {
  deckId: string
  request: EditDeckModelRequest
  deck: GenerateDeckResult
}) {
  const messages = getDeckHistory(deckId)

  if (!messages) {
    return null
  }

  messages.push(
    {
      role: "user",
      content: {
        kind: "edit",
        deckId: request.deckId,
        currentHtml: request.currentHtml,
        selections: request.selections,
        slideImages: request.slideImages,
      },
    },
    {
      role: "assistant",
      content: deck,
    }
  )

  return messages
}

export function clearDeckHistoryForTests() {
  for (const deckId of Object.keys(deckHistoryStore)) {
    delete deckHistoryStore[deckId]
  }

  deckHistoryStore[EXAMPLE_DECK_ID] = exampleDeckHistory
}
