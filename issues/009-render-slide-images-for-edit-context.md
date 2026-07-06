# Render Slide Images for Edit Context

Labels: ready-for-agent

## Parent

Parent PRD: `docs/prd/pdf-guided-pharma-slide-deck-prototype.md`

## What to build

Add server-side support for producing image context for selected slide areas. Given the current HTML artifact and area selections, the server should render the relevant slide pages with Playwright and produce image data suitable for AI SDK multimodal input. At minimum, produce a full slide screenshot for each affected slide; crops or overlay images can be added if straightforward.

## Acceptance criteria

- [x] The server can render a specified `.slide-page` from the current HTML artifact to an image.
- [x] The render path accepts selected slide IDs derived from area selections.
- [x] The returned image data can be passed to AI SDK as image content.
- [x] The implementation preserves the same slide geometry used by PDF export.
- [x] Errors are clear when a requested slide cannot be found or rendered.
- [x] Tests or fixtures verify that image rendering is called with the expected slide IDs and HTML.

## Blocked by

- `issues/008-add-pencil-rectangle-selection-ui.md`
