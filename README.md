# Slidinator

Slidinator is a TanStack Start prototype that turns two PDFs into a short pharma training deck:

- a reference PDF for factual source material;
- a design PDF for visual style;
- an optional prompt/style URL for steering;
- an HTML slide preview;
- a PDF export of the generated deck.

The generated HTML is the source artifact. PDF is only the export format.

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
