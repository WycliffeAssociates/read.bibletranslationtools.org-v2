import { getRepoIndexLocal, getHeaders } from "functions/shared"

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
  let navSection = url.searchParams?.get("navSection")

  if (!user || !repo || !navSection) {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    })
  }
  // Used to rewrite A links via files Names
  const repoIndex = await getRepoIndexLocal(env, user, repo)
  let possibleFiles =
    repoIndex && repoIndex.navigation?.map((navOb) => navOb.File)

  // rewrite to use query params
  class aTagHandler {
    element(element: Element) {
      let href = element.getAttribute("href")
      if (!href) return
      let rep = href.replace(".html", "")
      let prepended = `?section=${rep}`
      element.setAttribute("href", prepended)
    }
  }

  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    let baseUrl = env.HTML_API_URL_BASE
    let finalUrl = `${baseUrl}/${user}/${repo}/${navSection}.html`
    let response = await fetch(finalUrl)
    // E[foo*="bar"]
    let newResp = new Response(response.body, {
      headers: getHeaders(url)
    })
    // return newResp
    let htmlRewriter = new HTMLRewriter()
    const handler = new aTagHandler()
    possibleFiles &&
      possibleFiles.forEach((possible) => {
        htmlRewriter.on(`a[href*='${possible}']`, handler)
      })
    return htmlRewriter.transform(newResp)
  } catch (error) {
    console.error(error)
    return new Response(null, {
      status: 404
    })
  }
}
