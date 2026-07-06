import type { DeckGenerationInput, GenerateDeckResult } from "./types"

export async function createMockDeck({
  referenceFile,
  designFile,
  extraPrompt,
  styleUrl,
}: DeckGenerationInput): Promise<GenerateDeckResult> {
  const referenceFileName = referenceFile.name || "reference.pdf"
  const designFileName = designFile.name || "design.pdf"
  const promptText =
    extraPrompt.trim() ||
    "Create a concise training deck for healthcare professionals."
  const styleText =
    styleUrl.trim() || "No website style reference supplied for this run."

  return {
    artifactId: `mock-${Date.now()}`,
    slideCount: 3,
    sourceSummary: {
      referenceFileName,
      designFileName,
      extraPrompt: promptText,
      styleUrl: styleText,
    },
    deckHtml: buildMockDeckHtml({
      referenceFileName,
      designFileName,
      promptText,
      styleText,
    }),
  }
}

function buildMockDeckHtml({
  referenceFileName,
  designFileName,
  promptText,
  styleText,
}: {
  referenceFileName: string
  designFileName: string
  promptText: string
  styleText: string
}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Mock Pharma Training Deck</title>
    <style>
      @page { size: 1280px 720px; margin: 0; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #edf3f2;
        color: #10231f;
        font-family: "Inter", "Segoe UI", sans-serif;
      }
      .deck {
        display: grid;
        gap: 28px;
        justify-content: center;
        padding: 32px;
      }
      .slide-page {
        width: 1280px;
        height: 720px;
        overflow: hidden;
        break-after: page;
        page-break-after: always;
        background: #fbfdfb;
        border: 1px solid #c8d8d3;
        display: grid;
        grid-template-rows: auto 1fr auto;
        padding: 48px 56px 34px;
        position: relative;
      }
      .slide-page::before {
        content: "";
        position: absolute;
        inset: 0 0 auto;
        height: 12px;
        background: linear-gradient(90deg, #166d5b, #57b39d 48%, #d4a62f);
      }
      header {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 32px;
        border-bottom: 2px solid #d6e3df;
        padding-bottom: 18px;
      }
      h1, h2 {
        margin: 0;
        color: #123d35;
        letter-spacing: 0;
      }
      h1 { font-size: 48px; line-height: 1.02; }
      h2 { font-size: 35px; line-height: 1.1; }
      .kicker, footer {
        color: #5f756e;
        font-size: 16px;
        font-weight: 650;
        text-transform: uppercase;
      }
      .content-grid {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 30px;
        padding: 30px 0;
      }
      .panel {
        border: 1px solid #c9dad5;
        border-radius: 8px;
        padding: 22px;
        background: #ffffff;
      }
      .callout {
        background: #e7f4ef;
        border-left: 8px solid #166d5b;
      }
      ul { margin: 0; padding-left: 22px; }
      li {
        margin: 0 0 13px;
        font-size: 25px;
        line-height: 1.28;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 20px;
      }
      th, td {
        border-bottom: 1px solid #dbe6e2;
        padding: 12px 10px;
        text-align: left;
        vertical-align: top;
      }
      th {
        color: #166d5b;
        font-size: 15px;
        text-transform: uppercase;
      }
      .metric-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 18px;
        padding-top: 30px;
      }
      .metric {
        border: 1px solid #c9dad5;
        border-radius: 8px;
        padding: 20px;
        background: #ffffff;
      }
      .metric strong {
        display: block;
        color: #166d5b;
        font-size: 35px;
        line-height: 1;
      }
      .metric span {
        display: block;
        margin-top: 8px;
        color: #425a53;
        font-size: 18px;
      }
      footer {
        display: flex;
        justify-content: space-between;
        border-top: 1px solid #d6e3df;
        padding-top: 14px;
      }
    </style>
  </head>
  <body>
    <main class="deck">
      <section class="slide-page" id="slide-1">
        <header>
          <div>
            <p class="kicker">Mock generated deck</p>
            <h1>Paracetamol Training Brief</h1>
          </div>
          <p class="kicker">Reference: ${escapeHtml(referenceFileName)}</p>
        </header>
        <div class="content-grid">
          <div class="panel callout">
            <h2>Generation target</h2>
            <ul>
              <li>Use uploaded product information as the factual source.</li>
              <li>Mirror the uploaded design PDF with dense training structure.</li>
              <li>Keep slide markup stable for preview, validation, and export.</li>
            </ul>
          </div>
          <div class="panel">
            <h2>Run inputs</h2>
            <table>
              <tbody>
                <tr><th>Design</th><td>${escapeHtml(designFileName)}</td></tr>
                <tr><th>Prompt</th><td>${escapeHtml(promptText)}</td></tr>
                <tr><th>Style URL</th><td>${escapeHtml(styleText)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <footer><span>Prototype preview</span><span>1 / 3</span></footer>
      </section>
      <section class="slide-page" id="slide-2">
        <header>
          <div>
            <p class="kicker">Clinical summary structure</p>
            <h2>Mock content blocks for downstream validation</h2>
          </div>
          <p class="kicker">HTML source of truth</p>
        </header>
        <div class="metric-row">
          <div class="metric"><strong>2-3</strong><span>Required slide-page sections</span></div>
          <div class="metric"><strong>16:9</strong><span>Fixed preview and export geometry</span></div>
          <div class="metric"><strong>0</strong><span>Scripts or unsafe inline handlers</span></div>
        </div>
        <div class="content-grid">
          <div class="panel">
            <h2>Training layout</h2>
            <ul>
              <li>Section headers give reviewers an easy scan path.</li>
              <li>Tables preserve dense product-information hierarchy.</li>
            </ul>
          </div>
          <div class="panel callout">
            <h2>Future replacement</h2>
            <ul>
              <li>The mock response uses the same contract planned for the real server route.</li>
            </ul>
          </div>
        </div>
        <footer><span>Shadow DOM preview target</span><span>2 / 3</span></footer>
      </section>
      <section class="slide-page" id="slide-3">
        <header>
          <div>
            <p class="kicker">Export-ready contract</p>
            <h2>Stable page CSS and slide containers</h2>
          </div>
          <p class="kicker">Design reference: ${escapeHtml(designFileName)}</p>
        </header>
        <div class="content-grid">
          <div class="panel">
            <h2>Markup guarantees</h2>
            <table>
              <thead>
                <tr><th>Need</th><th>Mock support</th></tr>
              </thead>
              <tbody>
                <tr><td>Print sizing</td><td>@page defines a fixed slide surface.</td></tr>
                <tr><td>Page breaks</td><td>Each .slide-page breaks after itself.</td></tr>
                <tr><td>Future selection</td><td>IDs are available per slide container.</td></tr>
              </tbody>
            </table>
          </div>
          <div class="panel callout">
            <h2>Reviewer note</h2>
            <ul>
              <li>This is intentionally mocked; real extraction and AI composition can replace only the server logic.</li>
            </ul>
          </div>
        </div>
        <footer><span>Generated artifact ${escapeHtml(referenceFileName)}</span><span>3 / 3</span></footer>
      </section>
    </main>
  </body>
</html>`
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;"
      case "<":
        return "&lt;"
      case ">":
        return "&gt;"
      case '"':
        return "&quot;"
      default:
        return "&#39;"
    }
  })
}
