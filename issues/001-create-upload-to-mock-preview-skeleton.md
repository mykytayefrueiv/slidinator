# Create the Upload-to-Mock-Preview Skeleton

Labels: ready-for-agent

## Parent

Parent PRD: `docs/prd/pdf-guided-pharma-slide-deck-prototype.md`

## What to build

Create the first end-to-end UI slice for the prototype without real AI generation. The user should be able to provide the two PDFs, an optional prompt, and an optional style URL, submit the form, and see a mocked valid HTML deck rendered inside a Shadow DOM preview. Use TanStack Query for the generation mutation shape so later tickets can replace the mock response with the real server route without redesigning the UI.

## Acceptance criteria

- [ ] The main screen contains inputs for reference PDF, design PDF, extra prompt, optional style URL, and a generate action.
- [ ] The generate action uses TanStack Query mutation state for loading, success, and error UI.
- [ ] A mocked valid HTML deck can be returned through the same client contract intended for real generation.
- [ ] The mocked deck renders in a Shadow DOM preview host, not an iframe.
- [ ] The preview includes 2-3 `.slide-page` sections so downstream validation/export work has realistic markup to use.
- [ ] Required-file validation prevents submission without both PDFs.
- [ ] Focused UI tests cover the basic form, loading state, error state, and preview success state.

## Blocked by

None - can start immediately.
