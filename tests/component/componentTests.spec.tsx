import { test, expect } from "@playwright/experimental-ct-solid"

import TestComponent from "../../src/components/Test"
// import TestComponent from "../../src/components/Test"

test.use({ viewport: { width: 500, height: 500 } })

test("Example component testing", async ({ mount }) => {
  const component = await mount(
    <TestComponent message="Solid Component Test" />
  )
  await expect(component).toContainText("Solid Component Test")
})
