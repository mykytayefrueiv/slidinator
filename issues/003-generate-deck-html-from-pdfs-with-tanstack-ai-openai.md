# Generate Deck HTML from PDFs with AI SDK and OpenAI via OpenRouter

Labels: done

## Parent

Parent PRD: `docs/prd/pdf-guided-pharma-slide-deck-prototype.md`

## What to build

Implement the real server-side generation route. The route should accept multipart form input, extract factual content from the reference PDF, render design PDF pages as visual references, and compose a complete raw HTML deck artifact using AI SDK with OpenRouter. The route should validate the generated HTML, run one repair attempt if needed, and return the validated HTML artifact to the client.

## Additional info

https://ai-sdk.dev/docs

## Acceptance criteria

- [x] A TanStack Start server route accepts reference PDF, design PDF, optional prompt, and optional style URL.
- [x] Reference PDF processing produces factual source material for the generation pipeline.
- [x] Design PDF processing renders page images for direct multimodal model input.
- [x] AI SDK wraps OpenRouter calls for fact extraction, deck composition with design images, and repair.
- [x] The deck composer prompts for dense pharma-training slide HTML with exactly 2-3 `.slide-page` sections.
- [x] Generated output is raw HTML, not JSON, markdown, or commentary.
- [x] Invalid generated HTML runs through one repair attempt before an error is returned.
- [x] The route returns clear user-facing errors when upload, extraction, model generation, validation, or repair fails.
- [x] Tests cover the HTML validation and one-repair contract used by generation.

## Blocked by

- `issues/002-add-html-deck-validation-and-repair-contract.md`
