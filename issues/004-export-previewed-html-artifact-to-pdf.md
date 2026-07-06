# Export the Previewed HTML Artifact to PDF

Labels: ready-for-agent

## Parent

Parent PRD: `docs/prd/pdf-guided-pharma-slide-deck-prototype.md`

## What to build

Add the PDF export path for generated deck artifacts. The client should send the current validated HTML artifact to a TanStack Start server route, and the server should render it with Playwright and return PDF bytes. The output should respect the artifact's print CSS and slide page dimensions.

## Acceptance criteria

- [ ] A TanStack Start server route accepts the generated HTML artifact for export.
- [ ] The server validates or re-validates the HTML before rendering.
- [ ] Playwright renders the HTML with backgrounds enabled.
- [ ] Playwright uses CSS page sizing so `@page` and `.slide-page` geometry control the PDF.
- [ ] The route returns PDF bytes with appropriate response headers for download.
- [ ] The client exposes a PDF download action only when a valid generated artifact exists.
- [ ] Tests cover the export route with a known valid HTML fixture, verifying that a PDF response is produced.

## Blocked by

- `issues/002-add-html-deck-validation-and-repair-contract.md`
