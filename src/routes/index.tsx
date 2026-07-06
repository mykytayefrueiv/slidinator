import { createFileRoute } from "@tanstack/react-router"

import { UploadDeckPage } from "@/features/deck-generation/upload-deck-page"

export const Route = createFileRoute("/")({ component: UploadDeckPage })
