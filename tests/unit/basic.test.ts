import { assert, expect, test, beforeEach } from "vitest"
import { getPreferredLangFromHeader } from "../../src/lib/utils"
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
  expect(locale).toBe("en")
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

// test("JSON", () => {
//   const input = {
//     foo: "hello",
//     bar: "world"
//   }

//   const output = JSON.stringify(input)

//   expect(output).eq('{"foo":"hello","bar":"world"}')
//   assert.deepEqual(JSON.parse(output), input, "matches original")
// })
