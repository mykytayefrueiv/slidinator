# Connect End-to-End Generation, Preview, and PDF Download

Labels: done

## Parent

Parent PRD: `docs/prd/pdf-guided-pharma-slide-deck-prototype.md`

## What to build

Replace the mocked generation path with the real generation route and connect the full user flow. A user should be able to upload the example reference PDF and design PDF, provide optional guidance, generate a validated HTML deck, preview it in the Shadow DOM preview, and download a PDF from the same artifact.

## Acceptance criteria

- [x] The form submits real files and prompt inputs to the generation route.
- [x] TanStack Query reflects generation loading, success, and error states in the UI.
- [x] Successful generation renders the returned HTML artifact in the Shadow DOM preview.
- [x] PDF download uses the generated artifact currently shown in preview.
- [x] Export loading and error states are visible to the user.
- [x] Regenerating replaces the current artifact and updates the preview/download source.
- [x] User-facing errors are clear when generation or export fails.
- [x] End-to-end or integration coverage verifies the happy path with mocked server responses.

## Blocked by

- `issues/003-generate-deck-html-from-pdfs-with-tanstack-ai-openai.md`
- `issues/004-export-previewed-html-artifact-to-pdf.md`
