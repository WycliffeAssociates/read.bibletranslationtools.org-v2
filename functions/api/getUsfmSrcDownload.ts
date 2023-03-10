import { getHeaders, allParamsAreValid } from "functions/shared"
import { bibleBookSortOrder } from "@lib/contants"

export const onRequestPost: PagesFunction = async (context) => {
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
  let book = url.searchParams?.get("book") as string //type guard in if statement beneath; Cast here to satisfy typescript that I'm going to ensure that they are valid params

  if (!allParamsAreValid([user, repo, book])) {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    })
  }

  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    let baseUrl = env.PIPELINE_API_URL_BASE
    let finalUrl = `${baseUrl}/${user}/${repo}/source.usfm`
    let response = await fetch(finalUrl)

    const fileName = `${
      bibleBookSortOrder[book?.toUpperCase()]
    }-${book?.toUpperCase()}`
    let newResp = new Response(response.body, {
      headers: {
        ...getHeaders(url),
        "Content-Type": "application/octet-stream",
        "content-disposition": `attachment; filename=${fileName}.usfm`
      }
    })
    return newResp
  } catch (error) {
    console.error(error)
    return new Response(null, {
      status: 404
    })
  }
}
