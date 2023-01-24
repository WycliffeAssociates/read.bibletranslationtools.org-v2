let mode = import.meta.env.MODE
const devUrl = import.meta.env.PUBLIC_FUNCTIONS_API_BASE

// console.log(location)
// todo: change to a production url:
// read-dev.bibletranslationtools.org
// local scripture rendering pipeline: http://127.0.0.1:8788/api
const base =
  mode === "development"
    ? devUrl
    : mode === "test"
    ? devUrl
    : mode === "ci"
    ? devUrl
    : "https://readv2.bibleineverylanguage.org/api"

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
const FUNCTIONS_ROUTES = {
  getRepoIndex: ({ user, repo }: repo) =>
    `${base}/repoIndex?user=${user}&repo=${repo}`,
  getRepoHtml: ({ user, repo, book, chapter }: getRepoHtmlType) =>
    `${base}/getHtmlForChap?user=${user}&repo=${repo}&book=${book}&chapter=${chapter}`,
  getHtmlForTw: ({ user, repo, navSection }: getNonBibleRepoHtmlType) =>
    `${base}/getHtmlForTw?user=${user}&repo=${repo}&navSection=${navSection}`,
  getHtmlForTm: ({ user, repo, navSection }: getNonBibleRepoHtmlType) =>
    `${base}/getHtmlForTm?user=${user}&repo=${repo}&navSection=${navSection}`,
  getHtmlForCommentaryIndividualSection: ({
    file,
    user,
    repo
  }: commentaryIndividual) =>
    `${base}/getHtmlForCommentaryIndividualSection?user=${user}&repo=${repo}&file=${file}`,
  isValidRepo: ({ user, repo }: repo) =>
    `${base}/isValidRepo?user=${user}&repo=${repo}`
}

export { FUNCTIONS_ROUTES }
