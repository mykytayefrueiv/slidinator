import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"

import { SelectionPromptPanel } from "../prompt-panel"
import type { SlideSelection } from "../types"

const selections: Array<SlideSelection> = [
  {
    id: "selection-one",
    slideId: "slide-1",
    order: 1,
    renderedRect: { x: 10, y: 10, width: 100, height: 100 },
    normalizedRect: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
    prompt: "   ",
  },
]

describe("SelectionPromptPanel", () => {
  afterEach(() => {
    cleanup()
  })

  test("disables submit until a selection has real prompt text", () => {
    const onSubmit = vi.fn()
    const { rerender } = renderPanel({
      canSubmit: false,
      onSubmit,
    })

    const disabledSubmit = screen.getByRole("button", { name: /submit edit/i })

    expect(disabledSubmit).toHaveProperty("disabled", true)
    fireEvent.click(disabledSubmit)
    expect(onSubmit).not.toHaveBeenCalled()

    rerender(
      panel({
        canSubmit: true,
        onSubmit,
        panelSelections: [{ ...selections[0], prompt: "Make it shorter" }],
      })
    )

    const enabledSubmit = screen.getByRole("button", { name: /submit edit/i })

    expect(enabledSubmit).toHaveProperty("disabled", false)
    fireEvent.click(enabledSubmit)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})

function renderPanel({
  canSubmit,
  onSubmit,
}: {
  canSubmit: boolean
  onSubmit: () => void
}) {
  return render(
    panel({
      canSubmit,
      onSubmit,
      panelSelections: selections,
    })
  )
}

function panel({
  canSubmit,
  onSubmit,
  panelSelections,
}: {
  canSubmit: boolean
  onSubmit: () => void
  panelSelections: Array<SlideSelection>
}) {
  return (
    <SelectionPromptPanel
      selections={panelSelections}
      activeSelectionId={null}
      canSubmit={canSubmit}
      isSubmitting={false}
      onSelect={vi.fn()}
      onPromptChange={vi.fn()}
      onRemove={vi.fn()}
      onSubmit={onSubmit}
    />
  )
}
