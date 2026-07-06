# Export the Previewed HTML Artifact to PDF

Labels: done

## Parent

Parent PRD: `docs/prd/pdf-guided-pharma-slide-deck-prototype.md`

## What to build

Add the PDF export path for generated deck artifacts. The client should send the current validated HTML artifact to a TanStack Start server function, and the server should render it with Playwright and return PDF bytes. The output should respect the artifact's print CSS and slide page dimensions.

## Acceptance criteria

- [x] A TanStack Start server function accepts the generated HTML artifact for export.
- [x] The server validates or re-validates the HTML before rendering.
- [x] Playwright renders the HTML with backgrounds enabled.
- [x] Playwright uses CSS page sizing so `@page` and `.slide-page` geometry control the PDF.
- [x] The server function returns PDF bytes for download.
- [x] The client exposes a PDF download action only when a valid generated artifact exists.
- [x] Tests cover the export server function with a known valid HTML fixture, verifying that PDF bytes are produced.

## Blocked by

- `issues/002-add-html-deck-validation-and-repair-contract.md`
