# Connect Batch Area Edit to Preview and Export

Labels: ready-for-agent

## Parent

Parent PRD: `docs/prd/pdf-guided-pharma-slide-deck-prototype.md`

## What to build

Connect the rectangle selection UI on `/pdf/{deckId}` to the `editDeck` route so a user can draw multiple prompted selections, submit a batch edit, preview the regenerated HTML, and download an updated PDF from the edited artifact. The current artifact and `deckId` should remain synchronized after each edit.

## Acceptance criteria

- [ ] The `/pdf/{deckId}` UI exposes an edit action after selections have prompts.
- [ ] Submitting an edit sends `deckId`, current HTML, selections, and generated image context.
- [ ] The edit action uses TanStack Query mutation loading, success, and error states.
- [ ] Successful edit replaces the current HTML artifact in preview.
- [ ] Successful edit preserves or updates the current `deckId` history consistently.
- [ ] PDF download exports the edited artifact after a successful edit.
- [ ] Errors from missing prompts, rendering failure, AI failure, or validation failure are visible to the user.
- [ ] Tests cover the happy path and key error states with mocked server responses.

## Blocked by

- `issues/010-implement-editdeck-with-ai-sdk-history-and-geometry.md`
