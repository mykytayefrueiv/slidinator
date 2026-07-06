# Implement editDeck with AI SDK History and Geometry

Labels: ready-for-agent

## Parent

Parent PRD: `docs/prd/pdf-guided-pharma-slide-deck-prototype.md`

## What to build

Implement the first AI edit route/function for the `/pdf/{deckId}` workspace. `editDeck` should receive a `deckId`, current HTML artifact, and area selections with prompts. The server should render slide image context internally from those selections, retrieve prior generation history by `deckId`, append a multimodal user edit request containing image, geometry, and requested text changes, call AI SDK with OpenAI, validate the regenerated HTML, append the assistant response to history, and return the updated HTML artifact for the same deck route.

The intended request shape is:

```ts
type EditDeckRequest = {
  deckId: string
  currentHtml: string
  selections: AreaSelection[]
}
```

## Acceptance criteria

- [x] `editDeck` retrieves prior history by `deckId`.
- [x] The edit request includes selected slide IDs, normalized geometry, per-selection prompts, and internally rendered image context.
- [x] AI SDK is called with message/content-part input that can carry image context.
- [x] The model is instructed to return a complete updated raw HTML artifact.
- [x] Updated HTML runs through the existing validation and one-repair path.
- [x] The assistant response is appended to the deck's history.
- [x] Missing or unknown `deckId` returns a clear error.
- [x] Edits are scoped to the deck currently shown at `/pdf/{deckId}`.
- [x] Tests mock AI SDK and validate request assembly, history append behavior, validation success, and validation failure.

## Blocked by

- `issues/007-store-deck-generation-history-by-id.md`
- `issues/009-render-slide-images-for-edit-context.md`
