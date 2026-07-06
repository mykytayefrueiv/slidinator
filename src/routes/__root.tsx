import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"

import appCss from "../styles.css?url"
import { AppQueryClientProvider } from "@/providers/query-client"

const devConsoleFilterScript = `
(() => {
  const ignoredWarning = 'ObjectMultiplex - orphaned data for stream "metamask-multichain-provider"';
  const originalWarn = console.warn.bind(console);

  console.warn = (...args) => {
    if (args.some((arg) => String(arg).includes(ignoredWarning))) {
      return;
    }

    originalWarn(...args);
  };
})();
`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Slidinator | PDF-Guided Pharma Deck Generator",
      },
      {
        name: "description",
        content:
          "Generate compact pharma training slide decks from reference and design PDFs, preview validated HTML slides, and export to PDF.",
      },
      {
        name: "application-name",
        content: "Slidinator",
      },
      {
        name: "theme-color",
        content: "#047857",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:site_name",
        content: "Slidinator",
      },
      {
        property: "og:title",
        content: "Slidinator | PDF-Guided Pharma Deck Generator",
      },
      {
        property: "og:description",
        content:
          "Upload source and design PDFs to generate validated HTML pharma training slides with PDF export.",
      },
      {
        name: "twitter:card",
        content: "summary",
      },
      {
        name: "twitter:title",
        content: "Slidinator | PDF-Guided Pharma Deck Generator",
      },
      {
        name: "twitter:description",
        content:
          "Generate compact pharma training decks from reference and design PDFs.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.ico",
        sizes: "any",
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
    ],
  }),
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {import.meta.env.DEV ? (
          <script
            dangerouslySetInnerHTML={{ __html: devConsoleFilterScript }}
          />
        ) : null}
        <HeadContent />
      </head>
      <body>
        <AppQueryClientProvider>{children}</AppQueryClientProvider>
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
