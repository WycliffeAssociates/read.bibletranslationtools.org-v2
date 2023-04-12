import type { IcfEnv } from "@customTypes/types"
import {
  getRepoIndexLocal,
  getHeaders,
  allParamsAreValid,
  aTagHandler
} from "functions/shared"

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
  const repo = url.searchParams?.get("repo") as string
  const navSection = url.searchParams?.get("navSection")

  if (!allParamsAreValid([user, repo, navSection])) {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    })
  }
  // Used to rewrite A links via files Names
  const repoIndex = await getRepoIndexLocal(env, user, repo)
  const possibleFiles =
    repoIndex && repoIndex.navigation?.map((navOb) => navOb.File)

  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    const baseUrl = env.PIPELINE_API_URL_BASE
    const finalUrl = `${baseUrl}/${user}/${repo}/${navSection}.html`
    const response = await fetch(finalUrl)
    const newResp = new Response(response.body, {
      headers: getHeaders(url)
    })
    // return newResp
    const htmlRewriter = new HTMLRewriter()
    const handler = new aTagHandler(user, "TM")
    // This line is to transform Hrefs inside the manual from absolute whatever.html into query parameters on the same origin such as
    // <a href="?section=intro#translate-terms">Terms to Know</a>
    possibleFiles &&
      possibleFiles.forEach((possible) => {
        htmlRewriter.on(`a[href*='${possible}']`, handler)
      })
    return htmlRewriter.transform(newResp)
  } catch (error) {
    console.error(error)
    return new Response(null, {
      status: 404
    })
  }
}
