import { test, expect } from "@playwright/test"

test("test page titles; ", async ({ page }) => {
  await page.goto(
    "http://localhost:3000/read/WA-Catalog/ru_ulb/?book=%D0%91%D1%8B%D1%82%D0%B8%D0%B5&chapter=1"
  )

  // // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/ru_ulb/)

  await page.goto(
    "http://localhost:3000/read/WycliffeAssociates/en_ulb/?book=Genesis&chapter=1"
  )

  await expect(page).toHaveTitle(/en_ulb/)
})

test.only("codegen test", async ({ page }) => {
  await page.goto(
    "http://localhost:3000/read/WycliffeAssociates/en_ulb/?book=Genesis&chapter=1"
  )
  await Promise.all([
    page.waitForResponse(/api/),
    page.getByRole("link", { name: "Navigate forwards one chapter" }).click()
  ])

  let input = page.getByLabel("Quick Jump to Chapter By adjusting input")
  expect(input).toHaveValue(/2/)

  // await Promise.all([
  //   page.waitForResponse(/api/),
  //   page.getByRole("link", { name: "Navigate back one chapter" }).click()
  // ])

  // await expect(
  //   page.getByLabel("Quick Jump to Chapter By adjusting input")
  // ).toHaveValue(/1/)
})
