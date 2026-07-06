import { createServerFn } from "@tanstack/react-start"

export const generateDeck = createServerFn({ method: "POST" })
  .validator((formData: FormData) => formData)
  .handler(async ({ data }) => {
    const referenceFile = data.get("referencePdf")
    const designFile = data.get("designPdf")
    const extraPrompt = data.get("extraPrompt")
    const styleUrl = data.get("styleUrl")

    if (!(referenceFile instanceof File)) {
      throw new Error("Reference PDF is required.")
    }

    if (!(designFile instanceof File)) {
      throw new Error("Design PDF is required.")
    }

    const { createMockDeck } = await import("./mock-deck.server")

    return createMockDeck({
      referenceFile,
      designFile,
      extraPrompt: typeof extraPrompt === "string" ? extraPrompt : "",
      styleUrl: typeof styleUrl === "string" ? styleUrl : "",
    })
  })
