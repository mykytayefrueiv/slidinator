# Document Edit Flow and History Limitations

Labels: ready-for-agent

## Parent

Parent PRD: `docs/prd/pdf-guided-pharma-slide-deck-prototype.md`

## What to build

Update project documentation to explain the new `/pdf/{deckId}` workspace flow, the in-memory `deckId -> history[]` store, what context is sent to AI SDK for editing, and the prototype limitations. The documentation should make clear that history is retained only while the server process is alive and should be promoted to durable deck sessions later if needed.

## Acceptance criteria

- [x] Documentation explains how generation creates `deckId`, stores history, and redirects to `/pdf/{deckId}`.
- [x] Documentation explains that `/pdf/{deckId}` is the preview/edit/export workspace.
- [x] Documentation explains how rectangle selections, image context, geometry, and prompts are sent to `editDeck`.
- [x] Documentation explains that AI edits regenerate HTML and PDF remains an export.
- [x] Documentation states that history is in-memory and not durable.
- [x] Documentation includes the known limitations of full-HTML regeneration for localized edits.
- [x] Documentation includes local demo steps for generating, selecting, editing, previewing, and exporting.

## Blocked by

- `issues/011-connect-batch-area-edit-to-preview-and-export.md`
