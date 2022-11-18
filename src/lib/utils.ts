import { i18nDict, i18nDictKeysType } from "@lib/i18n"
export function getPreferredLangFromHeader(request: Request): i18nDictKeysType {
  const defaultLocale = "en"
  if (!request) return defaultLocale
  let langs = request.headers.get("Accept-Language")
  if (!langs) return defaultLocale
  let langsArr = langs.split(",").map((lang) => {
    let arr = lang.split(";")
    return arr[0]
  })
  let preferredLocale = defaultLocale //default
  for (let i = 0; i < langsArr.length; i++) {
    //   let val = item() as i18nDictSubKeysType
    const langKey = langsArr[i] as i18nDictKeysType
    if (i18nDict[langKey]) {
      preferredLocale = langKey
      break
    } else continue
  }
  return preferredLocale as i18nDictKeysType
}

interface bookChapterRequest {
  book: string | null
  chapter: string | null
  repoIndex: any //Todo: this is going to be an object, but don't know finale shape from Reuben. In end needs its own type shape from api;
}
export function getBookAndChapterFromUrl({
  book,
  chapter,
  repoIndex
}: bookChapterRequest): {
  book: string
  chapter: string
} {
  if (!book || !repoIndex[book]) {
    book = null
    chapter = null
  } else if (chapter && !repoIndex[book][chapter]) {
    // there is a book, and chap provided but this verfies that it is a a valid book/chap ;  Only set chap to null cause we can still use the book
    chapter = null
  }
  // todo: api signature from reuben will like change how to get this key
  let firstBookToRender = book || Object.keys(repoIndex)[0] //use first Key;
  let firstChapterToShow = chapter || repoIndex[firstBookToRender][0]

  return { book: firstBookToRender, chapter: firstChapterToShow }
}

// todo change this repoIndex type when finalize
export function reshapeIndexWithInitialData({
  repoIndex,
  book,
  chapter,
  initialData
}: any): any {
  let copy = structuredClone(repoIndex)
  // this restructuring is to reduce the off by 1 nature of Arrays since we can start the object with a key of '1'.  there are some other places that we still need to consider the array index, but I think a little simpler here as obj for access.  E.g. Object.Matthew.1,
  type finalIndexType = {
    [index: string]: {
      [index: string]: string | null
    }
  }
  let finalIndex: finalIndexType = {}
  for (const property in copy) {
    copy[property].forEach((ch: string) => {
      if (!finalIndex[property]) {
        finalIndex[property] = {}
      }
      finalIndex[property][ch] = null
    })
  }
  finalIndex[book][chapter] = initialData
  return finalIndex
}

export function res404(reason: string) {
  return new Response(null, {
    status: 404,
    statusText: reason
  })
}
