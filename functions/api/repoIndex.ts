import type { IcfEnv } from "@customTypes/types"
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
  const env = context.env as IcfEnv & typeof context.env

  const url = new URL(request.url)
  const user = url.searchParams?.get("user")
  const repo = url.searchParams?.get("repo")
  if (!user || !repo || user == "undefined" || repo == "undefined") {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    })
  }

  let returnValue

  const baseUrl = env.PIPELINE_API_URL_BASE
  const finalUrl = `${baseUrl}/${user}/${repo}/index.json`
  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    const response = await fetch(finalUrl, {
      headers: {
        "Content-Type": "application/json"
      }
    })

    returnValue = response.body
    return new Response(returnValue, {
      headers: getHeaders()
    })
  } catch (error) {
    console.error(error)
    return new Response(null, {
      status: 404,
      statusText: `Fetch for ${finalUrl} failed.`
    })
  }
}
