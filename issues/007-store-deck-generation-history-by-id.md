# Store Deck Generation History by ID

Labels: done

## Parent

Parent PRD: `docs/prd/pdf-guided-pharma-slide-deck-prototype.md`

## What to build

Add a simple server-side in-memory history store for generated decks. When a deck is generated, the server should create a `deckId`, store the generation prompt/context and assistant HTML response under that ID, and redirect the user to `/pdf/{deckId}` using TanStack Start redirect behavior. This prepares the preview/edit route to retrieve prior generation context without introducing durable persistence yet.

The intended prototype shape is:

```ts
type DeckHistoryStore = Record<string, DeckAiMessage[]>

type DeckAiMessage = {
  role: "user" | "assistant"
  content: unknown
}
```

## Acceptance criteria

- [x] Successful deck generation creates a stable `deckId`.
- [x] The server stores generation context and assistant HTML response under that `deckId`.
- [x] The generation flow redirects to `/pdf/{deckId}` after successful generation.
- [x] A `/pdf/{deckId}` route can retrieve the generated artifact by ID for preview.
- [x] The store is explicitly in-memory and documented as prototype-only.
- [x] Regenerating creates a new `deckId` rather than mutating an unrelated deck history.
- [x] Tests cover storing and retrieving history by ID without depending on live AI calls.

## Done

- Added a prototype-only in-memory `DeckHistoryStore` keyed by `deckId`.
- Stored typed `user` and `assistant` messages for each generated deck.
- Stored reusable generation context in the `user` message: upload metadata, extracted reference material, rendered design material, and extracted facts.
- Stored the final generated deck artifact in the `assistant` message.
- Redirected successful generation to `/pdf/{deckId}`.
- Added `/pdf/$deckId` retrieval/preview route.
- Split upload and deck-view UI into separate feature folders.
- Added tests for storing and retrieving independent deck histories without live AI calls.

## Blocked by

None - can start immediately.
