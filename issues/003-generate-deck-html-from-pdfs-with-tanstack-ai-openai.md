# Generate Deck HTML from PDFs with TanStack AI and OpenAI

Labels: ready-for-agent

## Parent

Parent PRD: `docs/prd/pdf-guided-pharma-slide-deck-prototype.md`

## What to build

Implement the real server-side generation route. The route should accept multipart form input, extract factual content from the reference PDF, derive visual style guidance from the design PDF, and compose a complete raw HTML deck artifact using TanStack AI with OpenAI as the first provider. The route should validate the generated HTML, run one repair attempt if needed, and return the validated HTML artifact to the client.

## Acceptance criteria

- [ ] A TanStack Start server route accepts reference PDF, design PDF, optional prompt, and optional style URL.
- [ ] Reference PDF processing produces factual source material for the generation pipeline.
- [ ] Design PDF processing produces visual style guidance, using rendered or sampled pages as the basis for model input.
- [ ] TanStack AI wraps OpenAI calls for fact extraction, style extraction, deck composition, and repair.
- [ ] The deck composer prompts for dense pharma-training slide HTML with exactly 2-3 `.slide-page` sections.
- [ ] Generated output is raw HTML, not JSON, markdown, or commentary.
- [ ] Invalid generated HTML runs through one repair attempt before an error is returned.
- [ ] The route returns clear user-facing errors when upload, extraction, model generation, validation, or repair fails.
- [ ] Tests mock model responses and PDF processing to cover successful generation, repair success, and repair failure.

## Blocked by

- `issues/002-add-html-deck-validation-and-repair-contract.md`
