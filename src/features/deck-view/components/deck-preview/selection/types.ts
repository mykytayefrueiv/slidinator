export type SelectionRect = {
  x: number
  y: number
  width: number
  height: number
}

export type SlideSelection = {
  id: string
  slideId: string
  order: number
  renderedRect: SelectionRect
  normalizedRect: SelectionRect
  prompt: string
}
