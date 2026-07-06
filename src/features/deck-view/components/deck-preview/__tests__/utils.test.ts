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

  test("adapts document root styles and body attributes for shadow rendering", () => {
    const deck = parseDeckHtml(`<!doctype html>
<html>
  <head>
    <style>:root { --navy: #053d54; } .cover { background: var(--navy); }</style>
  </head>
  <body class="deck-theme" data-template="pharma">
    <section class="slide-page cover">Cover</section>
  </body>
</html>`)

    expect(deck.headHtml).toContain(":host { --navy: #053d54; }")
    expect(deck.headHtml).not.toContain(":root")
    expect(deck.bodyAttributes).toContain(
      'class="deck-theme slide-preview-body"'
    )
    expect(deck.bodyAttributes).toContain('data-template="pharma"')
  })
})
