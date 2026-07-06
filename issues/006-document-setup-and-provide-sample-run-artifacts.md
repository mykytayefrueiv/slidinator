# Document Setup and Provide Sample Run Artifacts

Labels: done

## Parent

Parent PRD: `docs/prd/pdf-guided-pharma-slide-deck-prototype.md`

## What to build

Document how to run and evaluate the prototype, including required environment variables, dependency setup, local development commands, and the expected flow using the provided paracetamol reference PDF and pharma design PDF. Produce or record a sample generated 2-3 slide PDF artifact from the implemented flow.

## Acceptance criteria

- [ ] README or project documentation explains local setup, required environment variables, and run commands.
- [ ] Documentation identifies OpenAI as the AI provider through AI SDK.
- [ ] Documentation explains the upload/generate/preview/download flow.
- [ ] Documentation explains that HTML is the editable artifact and PDF is an export.
- [ ] Documentation includes the coordinate/editing architecture note at a high level, while making clear rectangle UI is out of scope for v1.
- [ ] A sample generated 2-3 slide PDF is produced or its generation steps are documented using the provided PDFs.
- [ ] Documentation includes troubleshooting notes for missing API key, invalid HTML generation, and Playwright browser setup.

## Blocked by

- `issues/005-connect-end-to-end-generation-preview-and-pdf-download.md`
