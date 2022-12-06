export const onRequestGet: PagesFunction = async (context) => {
  // Contents of context object
  // const {
  //   request, // same as existing Worker API
  //   env, // same as existing Worker API
  //   params, // if filename includes [id] or [[path]]
  //   waitUntil, // same as ctx.waitUntil in existing Worker API
  //   next, // used for middleware or to fetch assets
  //   data // arbitrary space for passing data between middlewares
  // } = context

  const request: Request = context.request
  const env: any = context.env
  const url = new URL(request.url)
  let user = url.searchParams?.get("user")
  let repo = url.searchParams?.get("repo")
  let bookKey = url.searchParams?.get("book")
  let chapter = url.searchParams?.get("chapter")

  if (!user || !repo || !bookKey || !chapter) {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    })
  }
  type headersType = {
    "Content-Type": string
    "Access-Control-Allow-Origin"?: string
  }
  let headers: headersType = {
    "Content-Type": "text/html"
  }
  const allowedOrigins = ["localhost", "http://127.0.0.1"]
  if (allowedOrigins.some((origin) => url.origin.includes(origin))) {
    headers["Access-Control-Allow-Origin"] = "*"
  }

  class aTagHandler {
    element(element: Element) {
      console.log(element)
      let href = element.getAttribute("href")
      if (!href) return
      if (href && href.includes("/u/")) return
      //
      console.log(href)

      let hashWithoutHashTag = href.split("#")[1]
      //
      let parts = hashWithoutHashTag.split("-")
      let book = parts[2]
      let chapter = parts[3]
      console.log({ book, chapter, hashWithoutHashTag })

      let newUrl = `?book=${book}&chapter=${chapter}#${hashWithoutHashTag}`
      element.setAttribute("href", newUrl)
      element.setAttribute("data-chapter", chapter)
      element.setAttribute("data-book", book)
      element.setAttribute("data-hash", hashWithoutHashTag)
      element.setAttribute("data-crossref", "true")
    }
  }

  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    let baseUrl = env.HTML_API_URL_BASE
    let finalUrl = `${baseUrl}/${user}/${repo}/${bookKey}/${chapter}.html`
    let response = await fetch(finalUrl)

    let newResp = new Response(response.body, {
      headers
    })
    return new HTMLRewriter()
      .on("a[href*='tn-chunk-'", new aTagHandler())
      .transform(newResp)
    return newResp
  } catch (error) {
    console.error(error)
    return new Response(null, {
      status: 404
    })
  }
}
