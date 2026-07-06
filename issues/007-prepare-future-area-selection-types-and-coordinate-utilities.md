# Prepare Future Area-Selection Types and Coordinate Utilities

Labels: ready-for-agent

## Parent

Parent PRD: `docs/prd/pdf-guided-pharma-slide-deck-prototype.md`

## What to build

Prepare the non-UI architecture for future pencil-based rectangle editing. Add the selection type and coordinate utilities that convert between rendered slide coordinates and normalized `.slide-page` coordinates. Do not implement rectangle drawing UI or AI area editing in this slice.

The key planned selection shape from the PRD is:

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

## Acceptance criteria

- [ ] The codebase has a reusable type or schema for future area selections.
- [ ] Utilities convert rendered rectangle coordinates to normalized `.slide-page` coordinates.
- [ ] Utilities convert normalized `.slide-page` coordinates back to rendered coordinates for a given slide size.
- [ ] Coordinate utilities treat coordinates as relative to one slide page, not the viewport, whole document, or PDF.
- [ ] Tests cover standard rectangles, fractional coordinates, scaling, and edge cases such as zero-size or out-of-bounds input.
- [ ] No rectangle drawing UI or AI edit endpoint is added in this slice.

## Blocked by

- `issues/001-create-upload-to-mock-preview-skeleton.md`
