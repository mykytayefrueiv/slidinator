# Add Pencil Rectangle Selection UI

Labels: ready-for-agent

## Parent

Parent PRD: `docs/prd/pdf-guided-pharma-slide-deck-prototype.md`

## What to build

Add the user-facing area selection flow to the `/pdf/{deckId}` deck workspace over the Shadow DOM deck preview. The user should be able to enable a pencil/edit mode, draw one or more rectangles over rendered `.slide-page` elements, and attach a text prompt to each selection. Each selection should be stored with slide ID, rendered rectangle, normalized rectangle, prompt, and order.

## Acceptance criteria

- [ ] The `/pdf/{deckId}` preview has a pencil/edit mode control.
- [ ] In pencil mode, the user can draw rectangles over visible slide pages.
- [ ] The UI supports multiple selections across one or more slides.
- [ ] Each selection records the owning `slideId`.
- [ ] Each selection stores normalized coordinates relative to its `.slide-page`.
- [ ] Each selection can store its own text prompt.
- [ ] Existing selections remain visible and ordered.
- [ ] Tests cover coordinate normalization and selection state behavior.

## Blocked by

- `issues/007-store-deck-generation-history-by-id.md`
