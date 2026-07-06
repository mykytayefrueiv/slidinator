import { describe, expect, test } from "vitest"

import { parseDeckHtml } from "../utils"

describe("parseDeckHtml", () => {
  test("extracts head HTML and slide-page sections without browser DOM APIs", () => {
    const deck = parseDeckHtml(`<!doctype html>
<html>
  <head>
    <style>.slide-page { width: 1280px; height: 720px; }</style>
  </head>
  <body>
    <section class="slide-page intro">One</section>
    <section class="slide-page">Two</section>
  </body>
</html>`)

    expect(deck.headHtml).toContain(".slide-page")
    expect(deck.slides).toEqual([
      '<section class="slide-page intro">One</section>',
      '<section class="slide-page">Two</section>',
    ])
  })
})
