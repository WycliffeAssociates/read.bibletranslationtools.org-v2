import { getHeaders, allParamsAreValid } from "functions/shared"

export const onRequestGet: PagesFunction = async (context) => {
  const request: Request = context.request
  const env: any = context.env
  const url = new URL(request.url)
  let user = url.searchParams?.get("user") as string
  let repo = url.searchParams?.get("repo")
  let method = url.searchParams?.get("method")?.toUpperCase() as string //type guard in if statement beneath; Cast here to satisfy typescript that I'm going to ensure that they are valid params
  if (!["HEAD", "GET"].includes(method))
    return new Response(null, {
      status: 400,
      statusText: "Unsupported verb"
    })
  if (!allParamsAreValid([user, repo])) {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    })
  }
  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    let baseUrl = env.PIPELINE_API_URL_BASE
    let finalUrl = `${baseUrl}/${user}/${repo}/download.json`
    // debugger
    console.log({ finalUrl })
    let response = await fetch(finalUrl, {
      method: method == "GET" ? "GET" : "HEAD"
    })

    return new Response(response.body, {
      headers: {
        ...getHeaders(url),
        "Content-Type": "application/json"
      }
    })
  } catch (error) {
    console.error(error)
    return new Response(null, {
      status: 404
    })
  }
}
