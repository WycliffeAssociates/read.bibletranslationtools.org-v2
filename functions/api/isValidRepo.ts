import { getHeaders, allParamsAreValid } from "functions/shared"

export const onRequestGet: PagesFunction = async (context) => {
  // Contents of context object
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

  if (!allParamsAreValid([user, repo])) {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    })
  }

  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    let baseUrl = env.CHECK_VALID_REPO_URL
    let finalUrl = `${baseUrl}/${user}/${repo}`
    let response = await fetch(finalUrl)
    return new Response(response.body, {
      headers: getHeaders(url)
    })
  } catch (error) {
    console.error(error)
    return new Response(null, {
      status: 404
    })
  }
}
