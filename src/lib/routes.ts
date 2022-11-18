let mode = import.meta.env.MODE
let base =
  mode === "development"
    ? "http://127.0.0.1:8788/api"
    : "https://astro-live-reader.pages.dev/api"

interface getRepoHtmlType {
  user: string
  repo: string
  book: string
  chapter: string
}
interface repo {
  user: string
  repo: string
}

// these names need to align with the names of files in the functions folder.  They are cloudflare workers.
const FUNCTIONS_ROUTES = {
  getRepoIndex: ({ user, repo }: repo) =>
    `${base}/repoIndex?user=${user}&repo=${repo}`,
  getRepoHtml: ({ user, repo, book, chapter }: getRepoHtmlType) =>
    `${base}/getHtmlForChap?user=${user}&repo=${repo}&book=${book}&chapter=${chapter}`,
  isValidRepo: ({ user, repo }: repo) =>
    `${base}/isValidRepo?user=${user}&repo=${repo}`
}
export { FUNCTIONS_ROUTES }
