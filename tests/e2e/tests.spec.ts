import { test, expect } from "@playwright/test"
import { unstable_dev } from "wrangler"
import type { UnstableDevWorker } from "wrangler"
let worker: UnstableDevWorker

test.beforeAll(async () => {
  // A string containing a path to your Worker script, relative to your Worker project’s root directory.
  // https://developers.cloudflare.com/workers/wrangler/api/#parameters
  worker = await unstable_dev("functions/[[path]].js", {
    logLevel: "log",
    compatibilityDate: "2023-01-25",
    experimental: {
      disableExperimentalWarning: true
    }
  })
})

test.afterAll(async () => {
  await worker.stop()
})

test("test page titles; ", async ({ page }) => {
  await page.goto(
    "/WA-Catalog/ru_ulb/?book=%D0%91%D1%8B%D1%82%D0%B8%D0%B5&chapter=1"
  )

  // // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/ru_ulb/)

  await page.goto("/WycliffeAssociates/en_ulb/?book=Genesis&chapter=1")
  await expect(page).toHaveTitle(/en_ulb/)
})

// skip: changed to not use an input here
test("Menu chapter updates on nav", async ({ page }) => {
  await page.goto("/WycliffeAssociates/en_ulb/?book=Genesis&chapter=1")
  await page.waitForLoadState("networkidle") //JS has evaluated maybe? I think that's why I have this here

  await Promise.all([
    page.waitForResponse(/api/), //prefetch on page load calls the api
    page.getByTestId("NavForwardBtn").click()
  ])

  const input = page.getByTestId("chapterNavigation")
  await expect(input).toHaveText(/2/)

  await Promise.all([
    // don't wait for api call this time: Should already be loaded;
    page.getByTestId("NavBackBtn").click()
  ])

  await expect(page.getByTestId("chapterNavigation")).toHaveText(/1/)
})

test("Count Chapters On Book Changes", async ({ page }) => {
  await page.goto("/WycliffeAssociates/en_ulb/?book=Genesis&chapter=1")
  await page.waitForLoadState("networkidle") //JS has evaluated maybe? I think that's why I have this here
  await page.getByRole("button", { name: "Genesis" }).click()
  await page.getByRole("button", { name: "Exodus" }).click()
  const list = page.locator("[data-testid=menuChapter]")
  await expect(list).toHaveCount(40)
})

test("fallback to default locale", async ({ page, context }) => {
  // -- modify the request
  await context.route("**/*", (route, request) => {
    route.continue({
      headers: {
        ...request.headers(),
        "accept-language": "es,en;q=0.9,pt;q=0.8,pt-BR"
      }
    })
  })
  await page.goto("/WycliffeAssociates/en_ulb/?book=Genesis&chapter=1")
  const currentLanguage = page.locator("[data-js=languagePicker]")
  await expect(currentLanguage).toContainText("Español")
})

test("history url updating on ajax nav", async ({ page }) => {
  await page.goto("/WycliffeAssociates/en_ulb/")
  await page.waitForLoadState("networkidle")
  await Promise.all([
    // page.waitForResponse(/api/), //prefetch on page load calls the api or button click will.  Await either on click
    page.getByRole("link", { name: "Navigate forwards one chapter" }).click()
  ])
  await page.waitForSelector("#ch-2") //ensure chapter 2 of ulb loaded after button click above

  expect(page.url()).toContain("/WycliffeAssociates/en_ulb/?book=Gen&chapter=2")
})

test("navigate previous button hidden on first chapter", async ({ page }) => {
  await page.goto("/WycliffeAssociates/en_ulb/?book=Genesis&chapter=1")

  const placeholderBtn = page.getByTestId("NavBackBtn") //ensure chapter 2 of ulb loaded after button click above

  await expect(placeholderBtn).toHaveCount(0)
})
test("navigate next button hidden on last chapter", async ({ page }) => {
  await page.goto("/WycliffeAssociates/en_ulb/?book=Genesis&chapter=50")

  const placeholderBtn = page.getByTestId("NavForwardBtn") //ensure chapter 2 of ulb loaded after button click above

  await expect(placeholderBtn).toHaveCount(0)
})

test("Test language change in header", async ({ page }) => {
  await page.goto(
    "http://localhost:3000/WycliffeAssociates/en_ulb/?book=John&chapter=3"
  )
  const currentLanguageBtn = page.locator("[data-js=languagePicker]")
  await currentLanguageBtn.click()
  const spBtn = page.locator('[data-lang="es"]')
  await spBtn.click()
  await expect(currentLanguageBtn).toContainText("Español")
})

test.skip("Test hover of preview panes in desktop", async ({ page }) => {
  await page.goto(
    "http://localhost:3000/WycliffeAssociates/en_bc?book=mat&chapter=01"
  )
  await page.mouse.move(200, 200, { steps: 5 })
  const hoverableLink = page.locator("a[href*='popup://messiah']").first()
  await hoverableLink.hover()
  const previewPane = page.locator("#previewPane")

  // ------------------------------------
  // Check that pane renders with text
  await expect(previewPane).toHaveCount(1)
  await expect(previewPane).toContainText("Messiah")

  // ------------------------------------
  // close method 1:  The close btn
  const closePreviewBtn = page.getByTestId("closePreviewPane")
  await closePreviewBtn.click()
  await expect(previewPane).toHaveCount(0)

  // ------------------------------------
  // close method 2:  The Escape key
  await hoverableLink.hover()
  await expect(previewPane).toHaveCount(1)
  await page.keyboard.press("Escape")
  await expect(previewPane).toHaveCount(0)

  // ------------------------------------
  // close method 3: click outside
  await page.mouse.move(0, 0)
  await hoverableLink.hover()
  await expect(previewPane).toHaveCount(1)
  const textContainer = page.getByTestId("page-container")
  // await expect(textContainer).toHaveCount(1)
  // If you are not interested in testing your app under the real conditions and want to simulate the click by any means possible, you can trigger the HTMLElement.click() behavior via simply dispatching a click event on the element with locator.dispatchEvent():
  // We use a programmatic click, because while divs are not 'clickable' there is a listener on the body for clicks when the preview pane is open. If the target is not inside the preview pane itself, it treats the behavior as click outside and closes the preview pane.
  await textContainer.dispatchEvent("click")
  await textContainer.click()
  await expect(previewPane).toHaveCount(0)
})
