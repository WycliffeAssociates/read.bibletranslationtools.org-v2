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
  const env: any = context.env
  const url = new URL(request.url)
  let user = url.searchParams?.get("user") as string
  let repo = url.searchParams?.get("repo")
  let bookKey = url.searchParams?.get("book")
  let chapter = url.searchParams?.get("chapter")

  if (!allParamsAreValid([user, repo, bookKey, chapter])) {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    })
  }

  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    let baseUrl = env.PIPELINE_API_URL_BASE
    let finalUrl = `${baseUrl}/${user}/${repo}/${bookKey}/${chapter}.html`
    let response = await fetch(finalUrl)

    let newResp = new Response(response.body, {
      headers: getHeaders(url)
    })
    // NOTE: TN AND BIBLE CHAP ARE BOTH CHAPTER/VERSE SCHEMAS, SO THE SAME API FETCHER FUNCTION IS HERE USED, BUT WE REWRITE ANY FOUND TN LINKS AS WELL HERE.
    const handler = new aTagHandler(user, "TN")
    return new HTMLRewriter()
      .on("a[href*='tn-chunk-']", handler)
      .on("a[data-is-rc-link]", handler)
      .transform(newResp)
    return newResp
  } catch (error) {
    console.error(error)
    return new Response(null, {
      status: 404
    })
  }
}
