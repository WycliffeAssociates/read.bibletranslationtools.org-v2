import type { IcfEnv } from "@customTypes/types"
import { getHeaders, allParamsAreValid } from "functions/shared"

export const onRequestGet: PagesFunction = async (context) => {
  const request: Request = context.request
  const env = context.env as IcfEnv & typeof context.env
  const url = new URL(request.url)
  const user = url.searchParams?.get("user") as string
  const repo = url.searchParams?.get("repo")
  const book = url.searchParams?.get("book") //type guard in if statement beneath; Cast here to satisfy typescript that I'm going to ensure that they are valid params

  if (!allParamsAreValid([user, repo, book])) {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    })
  }
  try {
    const baseUrl = env.PIPELINE_API_URL_BASE
    const finalUrl = `${baseUrl}/${user}/${repo}/${book}/whole.json`

    const response = await fetch(finalUrl)

    if (response.ok) {
      return new Response(response.body, {
        headers: {
          ...getHeaders(),
          "Content-Type": "application/json"
        }
      })
    }
    return new Response(null, {
      status: 404,
      statusText: "that file does not exist for this repo"
    })
  } catch (error) {
    console.error(error)
    return new Response(null, {
      status: 404
    })
  }
}
