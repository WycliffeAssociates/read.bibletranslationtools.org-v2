import { getHeaders, allParamsAreValid } from "functions/shared"
import { bibleBookSortOrder } from "@lib/contants"
import type { IcfEnv } from "@customTypes/types"

export const onRequestPost: PagesFunction = async (context) => {
  const request: Request = context.request

  const env = context.env as IcfEnv & typeof context.env
  const url = new URL(request.url)
  const user = url.searchParams?.get("user") as string
  const repo = url.searchParams?.get("repo")
  const book = url.searchParams?.get("book") as string //type guard in if statement beneath; Cast here to satisfy typescript that I'm going to ensure that they are valid params

  if (!allParamsAreValid([user, repo, book])) {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    })
  }

  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    const baseUrl = env.PIPELINE_API_URL_BASE
    const finalUrl = `${baseUrl}/${user}/${repo}/source.usfm`
    const response = await fetch(finalUrl)

    const fileName = `${
      bibleBookSortOrder[book?.toUpperCase()]
    }-${book?.toUpperCase()}`
    const newResp = new Response(response.body, {
      headers: {
        ...getHeaders(),
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
