import { test, expect } from "@playwright/test"

test("test page titles; ", async ({ page }) => {
  await page.goto(
    "/read/WA-Catalog/ru_ulb/?book=%D0%91%D1%8B%D1%82%D0%B8%D0%B5&chapter=1"
  )

  // // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/ru_ulb/)

  await page.goto("/read/WycliffeAssociates/en_ulb/?book=Genesis&chapter=1")
  await expect(page).toHaveTitle(/en_ulb/)
})

// skip: changed to not use an input here
test.skip("Menu chapter input updates on nav", async ({ page }) => {
  await page.goto("/read/WycliffeAssociates/en_ulb/?book=Genesis&chapter=1")
  await page.waitForLoadState("networkidle") //JS has evaluated maybe? I think that's why I have this here

  await Promise.all([
    page.waitForResponse(/api/), //prefetch on page load calls the api
    page.getByRole("link", { name: "Navigate forwards one chapter" }).click()
  ])

  let input = page.getByLabel("Quick Jump to Chapter By adjusting input")
  await expect(input).toHaveValue(/2/)

  await Promise.all([
    // don't wait for api call this time: Should already be loaded;
    page.getByRole("link", { name: "Navigate back one chapter" }).click()
  ])

  await expect(
    page.getByLabel("Quick Jump to Chapter By adjusting input")
  ).toHaveValue(/1/)
})

test("Count Chapters On Book Changes", async ({ page }) => {
  await page.goto("/read/WycliffeAssociates/en_ulb/?book=Genesis&chapter=1")
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
  await page.goto("/read/WycliffeAssociates/en_ulb/?book=Genesis&chapter=1")
  const currentLanguage = page.locator("[data-js=languagePicker]")
  await expect(currentLanguage).toContainText("Español")
})

test("history url updating on ajax nav", async ({ page }) => {
  await page.goto("/read/WycliffeAssociates/en_ulb/")
  await page.waitForLoadState("networkidle")
  await Promise.all([
    page.waitForResponse(/api/), //prefetch on page load calls the api or button click will.  Await either on click
    page.getByRole("link", { name: "Navigate forwards one chapter" }).click()
  ])
  await page.waitForSelector("#ch-2") //ensure chapter 2 of ulb loaded after button click above

  expect(page.url()).toContain(
    "/read/WycliffeAssociates/en_ulb/?book=Gen&chapter=2"
  )
})

test("navigate previous button hidden on first chapter", async ({ page }) => {
  await page.goto("/read/WycliffeAssociates/en_ulb/?book=Genesis&chapter=1")

  const placeholderBtn = page.getByTestId("NavBackBtn") //ensure chapter 2 of ulb loaded after button click above

  await expect(placeholderBtn).toHaveCount(0)
})
test("navigate next button hidden on last chapter", async ({ page }) => {
  await page.goto("/read/WycliffeAssociates/en_ulb/?book=Genesis&chapter=50")

  const placeholderBtn = page.getByTestId("NavForwardBtn") //ensure chapter 2 of ulb loaded after button click above

  await expect(placeholderBtn).toHaveCount(0)
})

test("book and chapter query params work", async ({ page }) => {
  await page.goto("/read/WycliffeAssociates/en_ulb/?book=John&chapter=3")
  const display = page.getByTestId("menuLangBookDisplay")
  const menuNumInputChapDisplay = page.getByTestId("chapterNavigation")
  await expect(display).toContainText("English:John")
  await expect(menuNumInputChapDisplay).toHaveText("3")
})

test("Test language change in header", async ({ page }) => {
  await page.goto(
    "http://localhost:3000/read/WycliffeAssociates/en_ulb/?book=John&chapter=3"
  )
  const currentLanguageBtn = page.locator("[data-js=languagePicker]")
  await currentLanguageBtn.click()
  const spBtn = page.locator('[data-lang="es"]')
  await spBtn.click()
  await expect(currentLanguageBtn).toContainText("Español")
})
