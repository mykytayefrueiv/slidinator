# PRD: PDF-Guided Pharma Slide Deck Prototype

Status: ready-for-agent

## Problem Statement

Users need a simple prototype that can turn a reference PDF and a design reference PDF into a short, readable pharma-training slide deck. The generated deck must use facts from the reference PDF, visually follow the design document, render as an HTML preview, and download as a PDF. The prototype must also account architecturally for future rectangle-based AI editing, where users can mark areas of a slide and provide edit prompts for those areas.

The current project is a fresh TanStack Start application with a placeholder homepage and shadcn/ui button setup. There is no domain implementation yet, so this feature needs to establish the first real product flow and the main artifact model.

## Solution

Build a server-side deck generation flow with a simple client UI:

- The user uploads a source/reference PDF.
- The user uploads a design/style PDF.
- The user may enter an extra prompt.
- The user may optionally provide a website URL for additional style reference.
- The server extracts factual content from the reference PDF.
- The server extracts visual style guidance from the design PDF.
- A deck composer combines facts, style guidance, user prompt, and optional URL into a complete raw HTML artifact.
- The HTML artifact is validated and, if needed, repaired once by the model using structured validation errors.
- The app previews the generated HTML deck.
- The user can download a PDF rendered from the generated HTML through Playwright.
- The preview renders the generated HTML into a Shadow DOM host.

The generated HTML is the editable source of truth. PDF is only an export format. Future editing should modify the HTML artifact and then re-export a new PDF, rather than attempting to edit the PDF directly.

The prototype will continue using TanStack Start as the full-stack React framework. TanStack Query will manage client-side server state and mutations. TanStack AI will wrap model calls and use OpenAI as the first provider for the fact extraction, style extraction, composition, and repair stages. Playwright will render the validated HTML artifact to PDF.

## User Stories

1. As a prototype evaluator, I want to upload a reference PDF, so that the generated slides can be grounded in the supplied source material.
2. As a prototype evaluator, I want to upload a design PDF, so that the generated slides can mimic the visual style of an example presentation.
3. As a prototype evaluator, I want to add an extra text prompt, so that I can steer the focus or tone of the generated deck.
4. As a prototype evaluator, I want to optionally add a website URL for style reference, so that I can provide another source of visual inspiration when needed.
5. As a user, I want to generate 2-3 slides, so that I can quickly see a compact training deck prototype.
6. As a user, I want the generated slides to use only the reference PDF for factual claims, so that the deck does not invent unsupported content.
7. As a user, I want the design document to drive visual style, so that generated slides resemble the supplied pharma training presentation.
8. As a user, I want generated slides to be dense and structured, so that the result looks like pharma training material rather than a sparse marketing deck.
9. As a user, I want the app to preview the generated slides in the browser, so that I can inspect the output before downloading.
10. As a user, I want the preview to show the same HTML that will be rendered to PDF, so that preview and export stay consistent.
11. As a user, I want to download the generated deck as a PDF, so that I can share or evaluate the result outside the app.
12. As a developer, I want the generated HTML to be the primary deck artifact, so that future editing can operate on structured web content instead of PDF internals.
13. As a developer, I want the server to run generation, so that API keys, PDF processing, model calls, and PDF export remain off the client.
14. As a developer, I want fact extraction and style extraction to be separate internal stages, so that content grounding and visual analysis can be debugged independently.
15. As a developer, I want the UI to hide internal generation stages, so that the prototype feels like a simple end-user flow rather than an engineering dashboard.
16. As a developer, I want the composer to return raw HTML only, so that validation and rendering do not need to unwrap JSON or markdown.
17. As a developer, I want generated HTML to include explicit page structure, so that Playwright PDF export is deterministic.
18. As a developer, I want every slide to use a `.slide-page` container, so that validation, preview, export, and future coordinate logic can rely on a stable selector.
19. As a developer, I want every slide page to have fixed 16:9 geometry, so that rectangle coordinates can be normalized relative to a known surface.
20. As a developer, I want generated HTML to include print CSS and page breaks, so that the exported PDF splits into slides correctly.
21. As a developer, I want generated HTML to be validated before preview/export, so that broken or unsafe artifacts do not become the user-facing result.
22. As a developer, I want validation errors to be sent back to the model once for repair, so that minor generation mistakes can be recovered automatically.
23. As a user, I want clear error feedback when generation cannot produce a valid deck, so that I know the app failed gracefully.
24. As a future editor user, I want to click a pencil tool, so that I can enter an area-selection editing mode.
25. As a future editor user, I want to draw rectangles over slide areas, so that I can indicate exactly what region I want changed.
26. As a future editor user, I want to draw multiple rectangles, so that I can request multiple localized edits in one batch.
27. As a future editor user, I want each rectangle to have its own prompt, so that every selected area can receive a specific instruction.
28. As a future editor user, I want selected rectangles to remain visible, so that I can confirm the areas I marked.
29. As a future editor user, I want rectangle coordinates to be stored per slide, so that the app can identify the correct slide and selected area later.
30. As a future editor user, I want batch editing to send all rectangle prompts together, so that I can apply a set of related changes in one action.
31. As a developer, I want rectangle coordinates normalized relative to `.slide-page`, so that coordinates remain valid across preview scaling and PDF rendering.
32. As a developer, I want future AI edits to target HTML and regenerate the PDF, so that the rest of the deck remains as stable as possible.

## Implementation Decisions

- Build or modify these major modules:
  - Upload and generation form for reference PDF, design PDF, extra prompt, and optional style URL.
  - Server-side generation API that accepts multipart form input and returns a validated HTML artifact.
  - PDF text extraction module for the reference PDF.
  - Design PDF visual extraction module that renders or samples pages as images for model input.
  - Fact extraction agent that creates a factual brief from the reference PDF content.
  - Style extraction agent that creates a visual style brief from the design PDF pages.
  - Deck composition agent that returns a complete raw HTML document.
  - HTML validation module that enforces deck/page/rendering constraints.
  - HTML repair module that performs one model-based repair attempt from validation errors.
  - HTML preview component that renders the generated artifact in the app.
  - PDF export API that renders the generated HTML artifact through Playwright and returns a PDF.
  - Future-ready area selection state and coordinate utilities for pencil-mode rectangle selection.

- Continue with TanStack Start as the application framework. Use Start server routes for file upload, deck generation, and PDF export because the flow needs multipart upload handling and explicit PDF byte responses.

- Use TanStack Query for client-side server state:
  - generation as a mutation;
  - PDF export as a mutation/download action;
  - generated artifact and generation status as query/mutation state rather than hand-rolled async state where it meaningfully simplifies the UI;
  - avoid long-lived persistence in v1 because generated decks are not saved.

- Use TanStack AI for the AI orchestration layer:
  - provider adapters should sit behind TanStack AI rather than direct provider SDK calls in feature code;
  - OpenAI is the first provider;
  - model calls should be represented as composable internal activities for fact extraction, style extraction, deck composition, and repair;
  - feature code should still avoid direct OpenAI SDK calls so another provider can be swapped later if needed.

- Use Playwright for PDF export:
  - load the validated full HTML artifact into a headless browser page;
  - render with backgrounds enabled;
  - prefer CSS page size so the artifact's `@page` and `.slide-page` contract controls output geometry;
  - return PDF bytes from the server to the browser.

- Use Playwright to render and save/export the generated HTML as PDF. Do not introduce a second PDF rendering engine for v1.

- Render the generated HTML preview into a Shadow DOM host. V1 should create the Shadow DOM preview boundary and render the artifact into it, but should not implement rectangle drawing or AI area editing yet.

- Defer the exact HTML sanitization policy until implementation, while preserving the current hard constraints that scripts and unsafe event handlers are not allowed.

- Use a multi-stage internal generation pipeline:
  - Reference PDF to fact brief.
  - Design PDF to style brief.
  - Fact brief plus style brief plus user prompt and optional URL to complete HTML artifact.

- Keep the UI simple. Do not expose internal fact/style/composition stages as debug panels in the first version.

- Treat the generated HTML document as the main deck artifact. Do not persist generated artifacts server-side in v1.

- Download only PDF in v1. HTML download is out of scope for now.

- Require the deck composer to return raw HTML only. The response should be a full HTML document, not markdown, JSON, or commentary.

- Validate around browser rendering needs rather than strict W3C purity. The important contract is that the artifact can render as a slide deck, export to PDF, and support future coordinate selection.

- Enforce this page contract:
  - The document contains exactly 2 or 3 `.slide-page` sections.
  - Each `.slide-page` represents one slide.
  - Each `.slide-page` has fixed 16:9 dimensions.
  - The document includes `@page` print CSS.
  - The document includes page break rules such as `break-after: page` or `page-break-after: always`.
  - Scripts and inline event handlers are not allowed.

- If validation fails, make one repair request to the model. The repair prompt receives the invalid HTML and a structured list of validation errors, and must return a complete corrected raw HTML document.

- Use Shadow DOM preview rather than a sandboxed iframe for the future editing path, because rectangle selection and DOM measurement need direct control of the rendered slide pages while still containing generated styles.

- Future rectangle editing should be pencil-tool based rather than crosshair-language based. The technical behavior is still rectangle drawing, but this is not part of the first implementation.

- Future editing should support multiple selections. Each selection has its own prompt and can be included in a batch edit request.

- Coordinates must always be relative to a specific `.slide-page`, not the browser viewport, whole document, or PDF file.

- The key future selection type is:

```ts
type AreaSelection = {
  id: string
  slideId: string
  rect: {
    x: number
    y: number
    width: number
    height: number
  }
  normalizedRect: {
    x: number
    y: number
    width: number
    height: number
  }
  prompt: string
  order: number
}
```

- Normalized coordinates are calculated from the rendered slide dimensions:

```ts
normalizedX = rect.x / slideWidth
normalizedY = rect.y / slideHeight
normalizedWidth = rect.width / slideWidth
normalizedHeight = rect.height / slideHeight
```

- Future batch editing request shape should send the HTML artifact plus all selections, each with slide ID, normalized rectangle, prompt, and order.

## Testing Decisions

- Good tests should validate external behavior and stable contracts, not model internals or implementation details.

- Test the HTML validation module as a deep module. It should accept valid slide HTML and reject missing `.slide-page`, wrong slide counts, missing print/page CSS, scripts, inline event handlers, and missing page breaks.

- Test coordinate utilities as a deep module. They should convert rendered rectangle coordinates to normalized slide coordinates and back without depending on React or browser event details.

- Test the PDF export module with a known valid HTML fixture if Playwright is available in the test environment. The test should verify a PDF is produced and has the expected page count, not visual perfection.

- Test generation API behavior using mocked model responses. The API should return a valid artifact for valid model HTML, run one repair attempt for invalid model HTML, and return a useful error if repair fails.

- Test upload UI behavior at the component level once the form is implemented. The test should verify required inputs, generate button state, error display, preview display, and PDF download action wiring.

- Test TanStack Query integration at the UI boundary by asserting user-visible loading, success, and error states rather than internal hook calls.

- Test TanStack AI integration through adapter seams or mocked generation activities, not live provider calls.

- There is no prior test structure in the current project. Add focused Vitest tests for pure modules first, then add React Testing Library coverage for UI behavior where useful.

## Out of Scope

- Editing the PDF file directly.
- Real AI area editing in the first implementation.
- Rectangle drawing UI in the first implementation.
- PowerPoint export.
- Persisting generated decks or generation runs.
- Exposing fact/style/deck agent debug panels in the UI.
- Strict medical/regulatory factual verification beyond constraining the model to the extracted reference PDF and basic sanity checks.
- Perfect visual replication of the design PDF.
- Multiple design documents.
- User accounts, history, permissions, or collaboration.
- Production-grade document storage.
- A full W3C HTML validation service.
- Resizable or draggable rectangles unless they fall out naturally from the future selection implementation.

## Further Notes

- Example source PDF: `Paracetamol-Approved-PI-26-Nov-2021.pdf`.
- Example design PDF: `Pharma_training_presentation_design.pdf`.
- The desired visual direction is dense pharma training material with compact tables, section headers, callouts, medical layout hierarchy, and footer/source styling.
- The strongest architectural constraint is that HTML remains the editable artifact and PDF remains an export.
- The first implementation should prioritize end-to-end demo value: upload PDFs, generate slides, preview HTML, and download PDF.
- Technology choices fixed during planning:
  - TanStack Start for the full-stack app.
  - TanStack Query for client server-state and mutations.
  - TanStack AI for model orchestration and provider abstraction.
  - OpenAI as the first AI provider.
  - Playwright for HTML-to-PDF rendering.
- Use TanStack Start server routes for upload/generation/export endpoints.
- Use Shadow DOM for preview rendering in v1, without rectangle drawing yet.
- Decide the detailed sanitization implementation during the implementation task.
