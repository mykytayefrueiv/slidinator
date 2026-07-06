import { createOpenAI } from "@ai-sdk/openai"
import { generateObject, generateText } from "ai"
import { z } from "zod"
import type { ModelMessage } from "ai"

import { DeckGenerationUserError } from "../generation-errors"
import {
  buildDeckComposerPrompt,
  deckComposerSystemPrompt,
} from "../prompts/deck-composer-prompt"
import { buildFactExtractionPrompt } from "../prompts/fact-extraction-prompt"
import {
  buildRepairPrompt,
  deckRepairSystemPrompt,
} from "../prompts/deck-repair-prompt"
import type {
  DeckGenerationInput,
  DesignSourceMaterial,
  FactBrief,
  ReferenceSourceMaterial,
  RepairDeckHtmlInput,
} from "../types"

const FactExtractionSchema = z.object({
  productName: z.string(),
  audience: z.string(),
  keyFacts: z.array(z.string()).min(4).max(12),
  safetyPoints: z.array(z.string()).min(2).max(8),
  trainingTakeaways: z.array(z.string()).min(3).max(8),
})

export type DeckGenerationModel = {
  providerName: string
  extractFacts: (reference: ReferenceSourceMaterial) => Promise<FactBrief>
  composeDeckHtml: (input: {
    upload: DeckGenerationInput
    reference: ReferenceSourceMaterial
    design: DesignSourceMaterial
    facts: FactBrief
  }) => Promise<string>
  repairDeckHtml: (input: RepairDeckHtmlInput) => Promise<string>
}

export function createOpenRouterDeckGenerationModel(): DeckGenerationModel {
  const provider = createOpenRouterProvider()

  return {
    providerName: provider.providerName,
    async extractFacts(reference) {
      const prompt = buildFactExtractionPrompt(reference)

      try {
        console.log("[deck-generation] model call started", {
          kind: "structured",
          provider: provider.providerName,
          promptLength: prompt.user.length,
        })

        const result = await generateObject({
          model: provider.model,
          schema: FactExtractionSchema,
          system: prompt.system,
          prompt: prompt.user,
          temperature: 0.15,
        })

        console.log("[deck-generation] model call completed", {
          kind: "structured",
          provider: provider.providerName,
        })

        return result.object
      } catch (error) {
        console.error("[deck-generation] model call failed", {
          kind: "structured",
          provider: provider.providerName,
          message: error instanceof Error ? error.message : String(error),
        })

        throw new DeckGenerationUserError(
          "model-generation",
          "The AI model could not extract structured content from the reference PDF.",
          error
        )
      }
    },
    async composeDeckHtml({ upload, reference, design, facts }) {
      const prompt = buildDeckComposerPrompt({
        input: upload,
        reference,
        design,
        facts,
      })
      const images = designImages(design)

      try {
        console.log("[deck-generation] model call started", {
          kind: "text",
          provider: provider.providerName,
          promptLength: prompt.length,
          imageCount: images.length,
          maxTokens: 6_000,
        })

        const result = await generateText({
          model: provider.model,
          system: deckComposerSystemPrompt(),
          messages: buildImageMessages(prompt, images),
          temperature: 0.25,
          maxOutputTokens: 6_000,
        })

        console.log("[deck-generation] model call completed", {
          kind: "text",
          provider: provider.providerName,
          outputLength: result.text.length,
        })

        return stripModelWrapper(result.text)
      } catch (error) {
        console.error("[deck-generation] model call failed", {
          kind: "text",
          provider: provider.providerName,
          message: error instanceof Error ? error.message : String(error),
        })

        throw new DeckGenerationUserError(
          "model-generation",
          "The AI model could not generate a deck response. Check provider credentials and try again.",
          error
        )
      }
    },
    async repairDeckHtml(input) {
      const prompt = buildRepairPrompt(input)

      try {
        console.log("[deck-generation] model call started", {
          kind: "text",
          provider: provider.providerName,
          promptLength: prompt.length,
          maxTokens: 6_000,
        })

        const result = await generateText({
          model: provider.model,
          system: deckRepairSystemPrompt(),
          prompt,
          temperature: 0.25,
          maxOutputTokens: 6_000,
        })

        console.log("[deck-generation] model call completed", {
          kind: "text",
          provider: provider.providerName,
          outputLength: result.text.length,
        })

        return stripModelWrapper(result.text)
      } catch (error) {
        console.error("[deck-generation] model call failed", {
          kind: "text",
          provider: provider.providerName,
          message: error instanceof Error ? error.message : String(error),
        })

        throw new DeckGenerationUserError(
          "model-generation",
          "The AI model could not repair the generated deck HTML.",
          error
        )
      }
    },
  }
}

function buildImageMessages(
  text: string,
  images: Array<{ data: Buffer; mediaType: "image/png" }>
): Array<ModelMessage> {
  return [
    {
      role: "user",
      content: [
        { type: "text", text },
        ...images.map((image, index) => ({
          type: "file" as const,
          data: image.data,
          mediaType: image.mediaType,
          filename: `design-page-${index + 1}.png`,
        })),
      ],
    },
  ]
}

function designImages(design: DesignSourceMaterial) {
  return design.samples
    .map((sample) => sample.renderedImage)
    .filter((image): image is NonNullable<typeof image> => Boolean(image))
    .map((image) => ({
      data: image.data,
      mediaType: image.mediaType,
    }))
}

function createOpenRouterProvider() {
  const openRouterApiKey = requiredServerEnv("OPENROUTER_API_KEY")
  const model = requiredServerEnv("OPENROUTER_MODEL")
  const baseURL =
    serverEnv("OPENROUTER_BASE_URL") ?? "https://openrouter.ai/api/v1"

  console.log("[deck-generation] using AI provider", {
    provider: "openrouter",
    model,
    baseURL,
  })

  const openrouter = createOpenAI({
    apiKey: openRouterApiKey,
    baseURL,
    headers: {
      "HTTP-Referer": serverEnv("OPENROUTER_SITE_URL") ?? "http://localhost",
      "X-Title": serverEnv("OPENROUTER_APP_TITLE") ?? "Slidinator",
    },
  })

  return {
    providerName: `openrouter:${model}`,
    model: openrouter(model),
  }
}

function requiredServerEnv(name: string) {
  const value = serverEnv(name)

  if (!value) {
    throw new DeckGenerationUserError(
      "model-generation",
      `Missing AI provider configuration. Set ${name} on the server.`
    )
  }

  return value
}

function serverEnv(name: string) {
  const processValue = process.env[name]?.trim()

  if (processValue) {
    return processValue
  }

  const viteEnv = (import.meta as { env?: Record<string, string | undefined> })
    .env
  const viteValue = viteEnv?.[name]?.trim()

  return viteValue || undefined
}

function stripModelWrapper(value: string) {
  return value
    .trim()
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
}
