import { FUNCTIONS_ROUTES } from "@lib/routes"
import type { repoIndexObj } from "../types/types"

interface baseApiInfo {
  user: string
  repo: string
}
interface getRepoInfo extends baseApiInfo {
  book: string
  chapter: string
}
export async function getChapterHtml({
  user,
  repo,
  book,
  chapter
}: getRepoInfo): Promise<string | undefined> {
  if (!repo) return
  let fetchUrl = FUNCTIONS_ROUTES.getRepoHtml({ user, repo, book, chapter })
  try {
    const response = await fetch(fetchUrl)
    const data = await response.text()
    return data
  } catch (error) {
    console.error(error)
    return
  }
}

export async function getRepoIndex({
  user,
  repo
}: baseApiInfo): Promise<repoIndexObj | null> {
  if (!user || !repo) return null
  let fetchUrl = FUNCTIONS_ROUTES.getRepoIndex({ user, repo })
  try {
    const response = await fetch(fetchUrl)
    // todo: provide proper typing for data instead of any
    const data: any = await response.json()
    return data
  } catch (error) {
    console.error(error)
    return null
  }
}

export async function isValidRepo({
  user,
  repo
}: baseApiInfo): Promise<boolean> {
  if (typeof user !== "string" || typeof repo !== "string") return false
  const fetchUrl = FUNCTIONS_ROUTES.isValidRepo({ user, repo })
  try {
    let response = await fetch(fetchUrl)
    let isValid = await response.text()
    return !!(isValid == "true") || !!(isValid !== "false")
  } catch (error) {
    console.error(error)
    return false
  }
}
