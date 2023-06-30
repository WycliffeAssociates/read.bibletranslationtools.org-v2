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
  const user = url.searchParams?.get("user") as string
  const repo = url.searchParams?.get("repo")
  const bookKey = url.searchParams?.get("book")
  const chapter = url.searchParams?.get("chapter")

  if (!allParamsAreValid([user, repo, bookKey, chapter])) {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    })
  }
  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    const baseUrl = env.PIPELINE_API_URL_BASE
    const finalUrl = `${baseUrl}/${user}/${repo}/${bookKey}/${chapter}.html`
    const response = await fetch(finalUrl)

    const newResp = new Response(response.body, {
      headers: getHeaders()
    })
    // NOTE: TN AND BIBLE CHAP ARE BOTH CHAPTER/VERSE SCHEMAS, SO THE SAME API FETCHER FUNCTION IS HERE USED, BUT WE REWRITE ANY FOUND TN LINKS AS WELL HERE.
    const handler = new aTagHandler(user, "TN")
    return new HTMLRewriter()
      .on("a[href*='tn-chunk-']", handler)
      .on("a[data-is-rc-link]", handler)
      .transform(newResp)
  } catch (error) {
    console.error(error)
    return new Response(null, {
      status: 404
    })
  }
}
