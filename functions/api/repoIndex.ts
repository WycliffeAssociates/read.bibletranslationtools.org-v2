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
  if (!user || !repo) {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    })
  }
  type headersType = {
    "Content-Type": string
    "Access-Control-Allow-Origin"?: string
  }
  let headers: headersType = {
    "Content-Type": "application/json"
  }
  const allowedOrigins = ["localhost", "http://127.0.0.1"]
  if (allowedOrigins.some((origin) => url.origin.includes(origin))) {
    headers["Access-Control-Allow-Origin"] = "*"
  }
  let returnValue

  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    // todo: replace with real env driven url of azure api
    let baseUrl = env.HTML_API_URL_BASE
    let finalUrl = `${baseUrl}/${user}/${repo}/index.json`
    let response = await fetch(finalUrl)
    returnValue = response.body
    return new Response(returnValue, {
      headers
    })
  } catch (error) {
    console.error(error)
    return new Response(null, {
      status: 404
    })
  }
}
