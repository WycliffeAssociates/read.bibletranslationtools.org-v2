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

export function handleRcLinks(element: Element, href: string, user: string) {
  if (!element || !href || !user) return
  let linkUser = element.getAttribute("data-user") || user
  let repo = element.getAttribute("data-repo")
  if (!repo) return
  let category = element.getAttribute("data-category")
  let word = element.getAttribute("data-word")
  let templateType = element.getAttribute("data-type")
  if (templateType === "tw") {
    let newHref = `/read/${linkUser}/${repo}?section=${category}#${word}`
    element.setAttribute("href", newHref)
    element.setInnerContent(newHref)
  } else if (templateType === "tm") {
    let initialPage = element.getAttribute("data-page")
    let topic = element.getAttribute("data-topic")
    let newHref = `/read/${linkUser}/${repo}?section=${initialPage}#${topic}`
    element.setAttribute("href", newHref)
    element.setInnerContent(newHref)
  }
}
function handleInteralTnLinks(element: Element, href: string) {
  let hashWithoutHashTag = href.split("#")[1]
  let parts = hashWithoutHashTag.split("-")
  let book = parts[2]
  let chapter = parts[3]
  console.log("STEP 5")
  console.log({ book, chapter })

  let newUrl = `?book=${book}&chapter=${chapter}#${hashWithoutHashTag}`
  element.setAttribute("href", newUrl)
  element.setAttribute("data-chapter", chapter)
  element.setAttribute("data-book", book)
  element.setAttribute("data-hash", hashWithoutHashTag)
  element.setAttribute("data-crossref", "true")
}
function handleTwLinks(element: Element, href: string) {
  if (!href) return
  if (href && href.includes("/u/")) return
  let rep = href.replace(".html", "")
  let parts = rep.split("#")
  let section = parts[0]
  let hash = parts[1]
  let newUrl = `?section=${section}#${parts[1]}`
  element.setAttribute("href", newUrl)
  element.setAttribute("data-section", section)
  element.setAttribute("data-hash", hash)
  element.setAttribute("data-crossref", "true")
}
function handleTMLinks(element: Element, href: string) {
  let rep = href.replace(".html", "")
  let prepended = `?section=${rep}`
  element.setAttribute("href", prepended)
}

export class aTagHandler {
  user: string
  functionContext: "TW" | "TN" | "TM"
  constructor(user: string, functionContext: "TW" | "TN" | "TM") {
    this.user = user
    this.functionContext = functionContext
  }
  element(element: Element) {
    let href = element.getAttribute("href")
    if (!href) return
    if (this.functionContext == "TN") {
      let rcLink = element.getAttribute("data-is-rc-link")
      let isRcLink = rcLink != null || rcLink != undefined
      if (href && isRcLink) {
        return handleRcLinks(element, href, this.user)
      }
      if (href.includes("tn-chunk")) {
        return handleInteralTnLinks(element, href)
      }
    } else if (this.functionContext == "TW") {
      return handleTwLinks(element, href)
    } else if (this.functionContext == "TM") {
      return handleTMLinks(element, href)
    }
  }
}
export function allParamsAreValid(params: Array<any>) {
  if (!params || !params.length) return
  if (
    params.some(
      (param) => !Boolean(param) || param == "undefined" || param == "false"
    )
  ) {
    return false
  } else {
    return true
  }
}
