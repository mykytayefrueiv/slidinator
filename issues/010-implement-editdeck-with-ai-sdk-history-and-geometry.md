# Implement editDeck with AI SDK History and Geometry

Labels: ready-for-agent

## Parent

Parent PRD: `docs/prd/pdf-guided-pharma-slide-deck-prototype.md`

## What to build

Implement the first AI edit route/function for the `/pdf/{deckId}` workspace. `editDeck` should receive a `deckId`, current HTML artifact, area selections, prompts, and slide image context. It should retrieve prior generation history by `deckId`, append a multimodal user edit request containing image, geometry, and requested text changes, call AI SDK with OpenAI, validate the regenerated HTML, append the assistant response to history, and return the updated HTML artifact for the same deck route.

The intended request shape is:

```ts
type EditDeckRequest = {
  deckId: string
  currentHtml: string
  selections: AreaSelection[]
  slideImages: Array<{
    slideId: string
    mimeType: "image/png" | "image/jpeg"
    data: string
  }>
}
```

## Acceptance criteria

- [ ] `editDeck` retrieves prior history by `deckId`.
- [ ] The edit request includes selected slide IDs, normalized geometry, per-selection prompts, and image context.
- [ ] AI SDK is called with message/content-part input that can carry image context.
- [ ] The model is instructed to return a complete updated raw HTML artifact.
- [ ] Updated HTML runs through the existing validation and one-repair path.
- [ ] The assistant response is appended to the deck's history.
- [ ] Missing or unknown `deckId` returns a clear error.
- [ ] Edits are scoped to the deck currently shown at `/pdf/{deckId}`.
- [ ] Tests mock AI SDK and validate request assembly, history append behavior, validation success, and validation failure.

## Blocked by

- `issues/007-store-deck-generation-history-by-id.md`
- `issues/009-render-slide-images-for-edit-context.md`
