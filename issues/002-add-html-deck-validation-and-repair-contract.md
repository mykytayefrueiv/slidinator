# Add HTML Deck Validation and Repair Contract

Labels: done

## Parent

Parent PRD: `docs/prd/pdf-guided-pharma-slide-deck-prototype.md`

## What to build

Add the validation layer for generated HTML deck artifacts and the repair seam used when AI output is invalid. The validator should focus on the deck contract needed by preview, PDF export, and future editing: parseable HTML, 2-3 `.slide-page` sections, deterministic print/page CSS, page breaks, and no scripts or unsafe inline event handlers. The repair path should be represented as a single retry seam that can be mocked in tests and later backed by AI SDK.

## Acceptance criteria

- [ ] Valid deck HTML with 2-3 `.slide-page` sections passes validation.
- [ ] HTML with missing `.slide-page`, wrong slide count, missing print CSS, missing page breaks, scripts, or inline event handlers fails with structured errors.
- [ ] Validation returns enough detail for a repair prompt to explain exactly what failed.
- [ ] A repair function contract accepts invalid HTML plus validation errors and returns corrected HTML.
- [ ] The generation flow can call validation and, on failure, one repair attempt before surfacing an error.
- [ ] Unit tests cover valid HTML, each major validation failure, and successful/failed repair behavior with mocked repair output.

## Blocked by

- `issues/001-create-upload-to-mock-preview-skeleton.md`
