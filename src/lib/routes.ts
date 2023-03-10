let mode = import.meta.env.MODE
const devUrl = import.meta.env.PUBLIC_FUNCTIONS_API_BASE
let base: string | undefined

interface getRepoHtmlType {
  user: string
  repo: string
  book: string
  chapter: string
}
interface getNonBibleRepoHtmlType {
  user: string
  repo: string
  navSection: string
}

interface repo {
  user: string
  repo: string
}
interface commentaryIndividual extends repo {
  file: string
}

// these names need to align with the names of files in the functions folder.  They are cloudflare workers.
export function setOriginUrl(origin: string) {
  base =
    import.meta.env.MODE === "development"
      ? devUrl
      : mode === "test"
      ? devUrl
      : mode === "ci"
      ? devUrl
      : `${origin}/api`
}
function supplyBaseLocation() {
  if (!import.meta.env.PROD) {
    return devUrl
  } else if (typeof window !== "undefined" && import.meta.env.PROD) {
    let clientBase = `${window.location.origin}/api`
    return clientBase
  } else if (import.meta.env.CI) {
    console.log("using dev in ci")
    return "http://127.0.0.1:8788/api"
  }
}

const FUNCTIONS_ROUTES = {
  getRepoIndex: ({ user, repo }: repo) => {
    base = base || supplyBaseLocation()
    return `${base}/repoIndex?user=${user}&repo=${repo}`
  },
  getRepoHtml: ({ user, repo, book, chapter }: getRepoHtmlType) => {
    base = base || supplyBaseLocation()
    return `${base}/getHtmlForChap?user=${user}&repo=${repo}&book=${book}&chapter=${chapter}`
  },
  getHtmlForTw: ({ user, repo, navSection }: getNonBibleRepoHtmlType) => {
    base = base || supplyBaseLocation()
    return `${base}/getHtmlForTw?user=${user}&repo=${repo}&navSection=${navSection}`
  },
  getHtmlForTm: ({ user, repo, navSection }: getNonBibleRepoHtmlType) => {
    base = base || supplyBaseLocation()
    return `${base}/getHtmlForTm?user=${user}&repo=${repo}&navSection=${navSection}`
  },
  getHtmlForCommentaryIndividualSection: ({
    file,
    user,
    repo
  }: commentaryIndividual) => {
    base = base || supplyBaseLocation()
    return `${base}/getHtmlForCommentaryIndividualSection?user=${user}&repo=${repo}&file=${file}`
  },
  downloadUsfmSrc: ({
    user,
    repo,
    book
  }: repo & {
    book: string | undefined
  }) => {
    if (!book) return
    base = base || supplyBaseLocation()
    return `${base}/getUsfmSrcDownload?user=${user}&repo=${repo}&book=${book}`
  },
  isValidRepo: ({ user, repo }: repo) => {
    base = base || supplyBaseLocation()
    return `${base}/isValidRepo?user=${user}&repo=${repo}`
  }
}

export { FUNCTIONS_ROUTES }
