import type { repoIndexObj } from "../src/customTypes/types"
export async function getRepoIndexLocal(
  env: any,
  user: string,
  repo: string
): Promise<repoIndexObj | null> {
  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    let baseUrl = env.HTML_API_URL_BASE
    let finalUrl = `${baseUrl}/${user}/${repo}/index.json`
    let response = await fetch(finalUrl)
    let jsonval = await response.json()
    return jsonval as repoIndexObj
  } catch (error) {
    console.error(error)
    return null
  }
}

type headersType = {
  "Content-Type": string
  "Access-Control-Allow-Origin"?: string
}
const allowedOrigins = ["localhost", "http://127.0.0.1"]
export function getHeaders(url: URL) {
  let headers: headersType = {
    "Content-Type": "text/html"
  }
  if (allowedOrigins.some((origin) => url.origin.includes(origin))) {
    headers["Access-Control-Allow-Origin"] = "*"
  }
  return headers
}
