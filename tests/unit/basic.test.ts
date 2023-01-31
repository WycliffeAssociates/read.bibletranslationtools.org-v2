import { assert, expect, test, beforeEach } from "vitest"

import { getPreferredLangFromHeader } from "@lib/utils"
import { FUNCTIONS_ROUTES } from "@lib/routes"
// Edit an assertion and save to see HMR in action
const baseUrl = "http://localhost:3000"
const enUlbRepo = "read/WycliffeAssociates/en_ulb"
test("default accept language fallback", () => {
  const request = new Request(`${baseUrl}/${enUlbRepo}`, {
    headers: {
      "accept-language": "xx"
    }
  })
  const locale = getPreferredLangFromHeader(request)
  expect(locale).toBe("en")
  // @ts-expect-error: No arg passed on purpose
  const withNullVal = getPreferredLangFromHeader()
  expect(withNullVal).toBe("en")
})

test("uses accept-language header of lang with translations", () => {
  const request = new Request(`${baseUrl}/${enUlbRepo}`, {
    headers: {
      "accept-language": "es"
    }
  })
  const locale = getPreferredLangFromHeader(request)
  expect(locale).toBe("es")
})
test("API - validRepo function determines valid repos", async () => {
  const params = {
    user: "WycliffeAssociates",
    repo: "en_ulb"
  }
  const url = FUNCTIONS_ROUTES.isValidRepo(params)
  const request = new Request(url)
  const response = await fetch(request)
  const data = await response.text()
  // pipeline returns 'true' as str instead of bool.
  expect(data).toBe("true")

  // And a repo that doesn't exist
  const params2 = {
    user: "WycliffeAssociates",
    repo: "en_ulbbb"
  }
  const url2 = FUNCTIONS_ROUTES.isValidRepo(params2)
  const request2 = new Request(url2)
  const response2 = await fetch(request2)
  const data2 = await response2.text()
  // pipeline returns 'false' as str instead of bool.
  expect(data2).toBe("false")
})

test("API - repoIndex fxn takes (user/repo) params and returns an index listing", async () => {
  // And a repo that doesn't exist
  let params = {
    user: "WycliffeAssociates"
    // repo: "en_ulb"
  }
  // expect cause missing param
  // @ts-expect-error
  const url = FUNCTIONS_ROUTES.getRepoIndex(params)
  const request = new Request(url)
  const response = await fetch(request)
  expect(response.status).toBe(400)

  // W/O user
  // @ts-expect-error
  const req2 = new Request(FUNCTIONS_ROUTES.getRepoIndex({ repo: "en_ulb" }))
  const resp2 = await fetch(req2)
  expect(resp2.status).toBe(400)

  // Proper:
  const reqProper = new Request(
    FUNCTIONS_ROUTES.getRepoIndex({
      repo: "en_ulb",
      user: "WycliffeAssociates"
    })
  )
  const respProper = await fetch(reqProper)
  const data: any = await respProper.json()
  expect(data.resourceType == "bible")
  expect(data.bible.length)
}, 10000)

test("API - HTML for Translations Words", async () => {
  // And a repo that doesn't exist
  let user = "WA-Catalog"
  let repo = "en_tw"
  let navSection = "names"
  const testRouteFxn = FUNCTIONS_ROUTES.getHtmlForTw

  // ----- INVALID REQUESTS ---------
  // expect cause missing param
  const reqMissUser = new Request(
    // @ts-expect-error
    testRouteFxn({ repo, navSection })
  )
  const reqMissRepo = new Request(
    // @ts-expect-error
    testRouteFxn({ user, navSection })
  )
  // @ts-expect-error
  const reqMissNav = new Request(testRouteFxn({ user, repo }))
  const resMissUser = await fetch(reqMissUser)
  const resMissRepo = await fetch(reqMissRepo)
  const resMissNav = await fetch(reqMissNav)
  expect(resMissUser.status).toBe(400)
  expect(resMissRepo.status).toBe(400)
  expect(resMissNav.status).toBe(400)

  // ----- VALID REQUESTS ---------
  const req = new Request(testRouteFxn({ user, repo, navSection }))
  const response = await fetch(req)
  const data: any = await response.text()
  expect(data).toBeTypeOf("string")
})
test("API - HTML for Translation Manual ", async () => {
  // params for req
  let user = "WA-Catalog"
  let repo = "en_tm"
  let navSection = "names"
  const testRouteFxn = FUNCTIONS_ROUTES.getHtmlForTm

  // ----- INVALID REQUESTS ---------
  // expect cause missing param
  const reqMissUser = new Request(
    // @ts-expect-error
    testRouteFxn({ repo, navSection })
  )
  const reqMissRepo = new Request(
    // @ts-expect-error
    testRouteFxn({ user, navSection })
  )
  // @ts-expect-error
  const reqMissNav = new Request(testRouteFxn({ user, repo }))
  const resMissUser = await fetch(reqMissUser)
  const resMissRepo = await fetch(reqMissRepo)
  const resMissNav = await fetch(reqMissNav)
  expect(resMissUser.status).toBe(400)
  expect(resMissRepo.status).toBe(400)
  expect(resMissNav.status).toBe(400)

  // ----- VALID REQUESTS ---------
  const req = new Request(testRouteFxn({ user, repo, navSection }))
  const response = await fetch(req)
  const data: any = await response.text()
  expect(data).toBeTypeOf("string")
})

test("API - HTML for Commentary ", async () => {
  // params for req
  let user = "WycliffeAssociates"
  let repo = "en_bc"
  let file = "abide"
  const testRouteFxn = FUNCTIONS_ROUTES.getHtmlForCommentaryIndividualSection

  // ----- INVALID REQUESTS ---------
  // expect cause missing param
  const reqMissUser = new Request(
    // @ts-expect-error
    testRouteFxn({ repo, file })
  )
  const reqMissRepo = new Request(
    // @ts-expect-error
    testRouteFxn({ user, file })
  )
  // @ts-expect-error
  const reqMissFile = new Request(testRouteFxn({ user, repo }))
  const resMissUser = await fetch(reqMissUser)
  const resMissRepo = await fetch(reqMissRepo)
  const resMissFile = await fetch(reqMissFile)
  expect(resMissUser.status).toBe(400)
  expect(resMissRepo.status).toBe(400)
  expect(resMissFile.status).toBe(400)

  // ----- VALID REQUESTS ---------
  const req = new Request(testRouteFxn({ user, repo, file }))
  const response = await fetch(req)
  const data: any = await response.text()
  expect(data).toBeTypeOf("string")
})

test("API - HTML for Commentary ", async () => {
  // params for req
  let user = "WycliffeAssociates"
  let repo = "en_bc"
  let file = "abide"
  const testRouteFxn = FUNCTIONS_ROUTES.getHtmlForCommentaryIndividualSection

  // ----- INVALID REQUESTS ---------
  // expect cause missing param
  const reqMissUser = new Request(
    // @ts-expect-error
    testRouteFxn({ repo, file })
  )
  const reqMissRepo = new Request(
    // @ts-expect-error
    testRouteFxn({ user, file })
  )
  // @ts-expect-error
  const reqMissFile = new Request(testRouteFxn({ user, repo }))
  const resMissUser = await fetch(reqMissUser)
  const resMissRepo = await fetch(reqMissRepo)
  const resMissFile = await fetch(reqMissFile)
  expect(resMissUser.status).toBe(400)
  expect(resMissRepo.status).toBe(400)
  expect(resMissFile.status).toBe(400)

  // ----- VALID REQUESTS ---------
  const req = new Request(testRouteFxn({ user, repo, file }))
  const response = await fetch(req)
  const data: any = await response.text()
  expect(data).toBeTypeOf("string")
})

test("API - Individual Bible Chapter ", async () => {
  // params for req
  let user = "WycliffeAssociates"
  let repo = "en_bc"
  let book = "mat"
  let chapter = "3"
  const testRouteFxn = FUNCTIONS_ROUTES.getRepoHtml

  // ----- INVALID REQUESTS ---------
  // expect cause missing param
  const reqMissUser = new Request(
    // @ts-expect-error
    testRouteFxn({ repo, book, chapter })
  )
  const reqMissRepo = new Request(
    // @ts-expect-error
    testRouteFxn({ user, book, chapter })
  )
  // @ts-expect-error
  const reqMissbook = new Request(testRouteFxn({ user, repo, chapter }))
  // @ts-expect-error
  const reqMissChapter = new Request(testRouteFxn({ user, repo, book }))
  const reqInvalidChapterNum = new Request(
    testRouteFxn({ user, repo, book, chapter: "50" })
  )

  /* ---- INVALID RESPONSES ------------ */
  const resMissUser = await fetch(reqMissUser)
  const resMissRepo = await fetch(reqMissRepo)
  const resMissBook = await fetch(reqMissbook)
  const resMissChapter = await fetch(reqMissChapter)
  const resInvChapNum = await fetch(reqInvalidChapterNum)
  expect(resMissUser.status).toBe(400)
  expect(resMissRepo.status).toBe(400)
  expect(resMissBook.status).toBe(400)
  expect(resMissChapter.status).toBe(400)
  // ----- VALID REQUESTS ---------
  const req = new Request(testRouteFxn({ user, repo, book, chapter }))
  const response = await fetch(req)
  const data: any = await response.text()
  expect(data).toBeTypeOf("string")
})
