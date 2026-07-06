import { createFileRoute } from "@tanstack/react-router"

import { GeneratedDeckPage } from "@/features/deck-view/generated-deck-page"
import { getGeneratedDeckById } from "@/server/deck-generation/api"

export const Route = createFileRoute("/pdf/$deckId")({
  loader: ({ params }) => getGeneratedDeckById({ data: params }),
  component: PdfDeckRoute,
})

function PdfDeckRoute() {
  const deck = Route.useLoaderData()

  return <GeneratedDeckPage deck={deck} />
}
