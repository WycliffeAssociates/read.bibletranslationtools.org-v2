import type { IcfEnv } from "@customTypes/types"
import { getHeaders, aTagHandler, allParamsAreValid } from "functions/shared"

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
  const env = context.env as IcfEnv & typeof context.env

  const url = new URL(request.url)
  const user = url.searchParams?.get("user") as string //invariants are checked below
  const repo = url.searchParams?.get("repo")
  const navSection = url.searchParams?.get("navSection")

  if (!allParamsAreValid([user, repo, navSection])) {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    })
  }

  class imgTagHandler {
    element(element: Element) {
      element.setAttribute("loading", "lazy")
    }
  }

  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    const baseUrl = env.PIPELINE_API_URL_BASE
    const finalUrl = `${baseUrl}/${user}/${repo}/${navSection}.html`
    const response = await fetch(finalUrl)
    // E[foo*="bar"]
    const newResp = new Response(response.body, {
      headers: getHeaders(url)
    })
    const aHandler = new aTagHandler(user, "TW")
    return new HTMLRewriter()
      .on("a[data-is-rc-link]", aHandler)
      .on("a[href*='html']", aHandler)
      .on("img[src*='content.bibletranslationtools.org'", new imgTagHandler())
      .transform(newResp)
  } catch (error) {
    console.error(error)
    return new Response(null, {
      status: 404
    })
  }
}
