# Slidinator

Slidinator is a TanStack Start prototype that turns two PDFs into a short pharma training deck:

- a reference PDF for factual source material;
- a design PDF for visual style;
- an optional prompt/style URL for steering;
- an HTML slide preview;
- a PDF export of the generated deck.

The generated HTML is the source artifact. PDF is only the export format.

## How It Works

Generation starts on the upload page. The server reads the reference PDF for
facts, samples the design PDF for visual context, asks the model for a complete
raw HTML deck, validates it, and repairs it once if needed. When that succeeds,
the app creates a `deckId`, stores the generation context and HTML response in
memory, and opens `/pdf/{deckId}`.

The `/pdf/{deckId}` page is the workspace. It previews the current HTML artifact,
lets you export it as a PDF, and lets you draw edit rectangles over slide areas.
PDF generation is deliberately simple: the server loads the validated HTML into
Playwright at the slide geometry, respects the deck's print CSS, and returns PDF
bytes. We do not edit PDFs directly; PDF is just the downloadable rendering of
the current HTML.

Editing also starts from the workspace. You draw one or more rectangles, write a
prompt for the areas that should change, and submit them together. The browser
sends `deckId`, the current HTML, and the prompted selections. The server renders
the affected slides with the selection rectangles overlaid, sends those images
plus the normalized geometry and prompts to the model, and asks for a full
updated raw HTML deck. The updated HTML is validated, repaired once if needed,
stored back under the same `deckId`, and shown in the preview. The next PDF
download uses that edited HTML.

History is prototype-only. It is a server-side in-memory `deckId -> history[]`
store, so it disappears when the dev server restarts and it is not suitable for
multi-instance or production use. Localized edits are also still full-HTML
regenerations under the hood, so the model can change nearby markup even when
the user selected a small area. Durable deck sessions and more constrained
patch-based editing are future work.

Quick demo path:

```text
Upload reference/design PDFs -> generate -> open /pdf/{deckId}
Toggle Edit -> draw rectangles -> add prompts -> Submit edit
Review updated preview -> Download PDF
```

## PDF Result Examples

You can result PDF examples in `result-examples/`

## Project Docs

- PRD: `docs/prd/pdf-guided-pharma-slide-deck-prototype.md`
- Implementation issues: `issues/`

## Code Structure Vision

- Keep routes thin; put product UI in `src/features/<feature-name>/`.
- Keep server workflows in `src/server/<domain>/`, exposed to the client through TanStack Start server functions.

## Setup

Install dependencies with Bun:

```bash
bun install
```

Create your local environment file:

```bash
cp .env.example .env
```

Fill `.env` with the required values from `.env.example`, especially `OPENROUTER_API_KEY`.

Run the app:

```bash
bun run dev
```

Open the local URL printed by Vite, usually `http://localhost:3000`.

## Useful Commands

```bash
bun run test
bun run typecheck
bun run lint
```
