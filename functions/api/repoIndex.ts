import { getHeaders } from "functions/shared"

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
  // console.log({ request })
  const env: any = context.env

  const url = new URL(request.url)
  let user = url.searchParams?.get("user")
  let repo = url.searchParams?.get("repo")
  console.log({ user, repo })
  if (!user || !repo || user == "undefined" || repo == "undefined") {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    })
  }

  let returnValue

  let baseUrl = env.PIPELINE_API_URL_BASE
  let finalUrl = `${baseUrl}/${user}/${repo}/index.json`
  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    console.log(`fetching ${finalUrl}`)
    let response = await fetch(finalUrl, {
      headers: {
        "Content-Type": "application/json"
      }
    })

    returnValue = response.body
    return new Response(returnValue, {
      headers: getHeaders(url)
    })
  } catch (error) {
    console.log(error)
    console.log(`Fetch for ${finalUrl} failed.`)
    return new Response(null, {
      status: 404,
      statusText: `Fetch for ${finalUrl} failed.`
    })
  }
}
