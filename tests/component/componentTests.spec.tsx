/* eslint-disable solid/no-destructure */
/* eslint-disable solid/reactivity */
import { test, expect } from "@playwright/experimental-ct-solid";
import TestComponent from "../../src/components/Test";

test.use({ viewport: { width: 500, height: 500 } });

test("should work", async ({ mount }) => {
  const component = await mount(
    <TestComponent message="component test here if" />
  );
  await expect(component).toContainText("component test here");
});
