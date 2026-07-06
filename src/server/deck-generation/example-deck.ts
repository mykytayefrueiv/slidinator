import type { DeckAiMessage } from "./history-store"
import type { GenerateDeckResult } from "./types"

export const EXAMPLE_DECK_ID = "example"

export const exampleGeneratedDeck: GenerateDeckResult = {
  artifactId: EXAMPLE_DECK_ID,
  slideCount: 3,
  sourceSummary: {
    referenceFileName: "example-reference.pdf",
    designFileName: "example-design.pdf",
    extraPrompt: "Highlight core efficacy and safety points.",
    styleUrl: "https://example.com/example-style",
    provider: "seeded-example",
  },
  deckHtml: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: 1280px 720px; margin: 0; }
      body { margin: 0; font-family: Arial, sans-serif; color: #10221d; }
      .slide-page {
        box-sizing: border-box;
        width: 1280px;
        height: 720px;
        break-after: page;
        page-break-after: always;
        padding: 72px 88px;
        background: linear-gradient(135deg, #f7fbf8 0%, #e6f4ef 100%);
        position: relative;
        overflow: hidden;
      }
      .slide-page::after {
        content: "";
        position: absolute;
        right: -120px;
        bottom: -170px;
        width: 460px;
        height: 460px;
        border-radius: 999px;
        background: rgba(35, 132, 103, 0.14);
      }
      .eyebrow {
        color: #087054;
        font-size: 24px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      h1 {
        max-width: 820px;
        margin: 28px 0 24px;
        font-size: 72px;
        line-height: 0.98;
        letter-spacing: -0.04em;
      }
      h2 {
        margin: 0 0 28px;
        font-size: 48px;
        line-height: 1.05;
      }
      p {
        max-width: 780px;
        margin: 0;
        color: #38524b;
        font-size: 30px;
        line-height: 1.35;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 28px;
        margin-top: 44px;
      }
      .card {
        min-height: 210px;
        border: 1px solid rgba(8, 112, 84, 0.18);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.78);
        padding: 30px;
        box-shadow: 0 24px 50px rgba(24, 74, 62, 0.12);
      }
      .metric {
        display: block;
        margin-bottom: 18px;
        color: #087054;
        font-size: 52px;
        font-weight: 800;
      }
      .card p {
        font-size: 24px;
      }
      ul {
        display: grid;
        gap: 22px;
        max-width: 860px;
        margin: 34px 0 0;
        padding-left: 32px;
        color: #38524b;
        font-size: 30px;
        line-height: 1.3;
      }
    </style>
  </head>
  <body>
    <section class="slide-page">
      <div class="eyebrow">Clinical training module</div>
      <h1>Example pharma deck ready for guided edits</h1>
      <p>Use edit mode to select any part of this slide and describe the change you want in the card below.</p>
    </section>
    <section class="slide-page">
      <div class="eyebrow">Key evidence</div>
      <h2>Focused talking points for field teams</h2>
      <div class="grid">
        <div class="card"><span class="metric">1</span><p>Introduce the treatment context and patient profile.</p></div>
        <div class="card"><span class="metric">2</span><p>Summarize efficacy outcomes in plain language.</p></div>
        <div class="card"><span class="metric">3</span><p>Close with safety reminders and escalation guidance.</p></div>
      </div>
    </section>
    <section class="slide-page">
      <div class="eyebrow">Safety reminder</div>
      <h2>Make the next edit precise</h2>
      <p>Select a paragraph, card, chart area, or headline. Each rectangle keeps normalized coordinates, so requests survive preview resizing.</p>
      <ul>
        <li>Mark multiple regions on the same slide.</li>
        <li>Move between slides and keep every request ordered.</li>
        <li>Attach one prompt to each selected region.</li>
      </ul>
    </section>
  </body>
</html>`,
}

export const exampleDeckHistory: Array<DeckAiMessage> = [
  {
    role: "assistant",
    content: exampleGeneratedDeck,
  },
]
