export function parseDeckHtml(html: string) {
  const parsedHtml = new DOMParser().parseFromString(html, "text/html")
  const slideElements = Array.from(parsedHtml.querySelectorAll(".slide-page"))
  const slides =
    slideElements.length > 0
      ? slideElements.map((slide) => slide.outerHTML)
      : [parsedHtml.body.innerHTML]

  return {
    headHtml: parsedHtml.head.innerHTML,
    slides,
  }
}
