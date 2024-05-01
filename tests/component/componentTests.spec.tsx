/* eslint-disable solid/no-destructure */
/* eslint-disable solid/reactivity */

import { test, expect } from "@playwright/experimental-ct-solid";

import TestComponent from "../../src/components/Test";
// import TestComponent from "../../src/components/Test"

test.use({ viewport: { width: 500, height: 500 } });

test("should work", async ({ mount }) => {
  const component = await mount(
    // @ts-expect-error I don't know what it's complaining about, but we aren't currenlty testing components: May 01, 2024.
    <TestComponent message="component test here if" />
  );
  await expect(component).toContainText("component test here");
});
