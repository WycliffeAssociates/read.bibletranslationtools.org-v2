import { get, set } from "idb-keyval"
import {
  createSignal,
  onMount,
  Show,
  createMemo,
  batch,
  For,
  createEffect,
  Setter
} from "solid-js"
import { useI18n } from "@solid-primitives/i18n"
import type { storeType } from "../ReaderWrapper/ReaderWrapper"

interface settingsProps {
  fetchHtml: storeType["fetchHtml"]
  mutateStoreText: storeType["mutateStoreText"]
  currentBookObj: storeType["currentBookObj"]
  setPrintWholeBook: Setter<boolean>
  user: string
  repo: string
}

export default function Settings(props: settingsProps) {
  const [t] = useI18n()
  const [preparingPrint, setPreparingPrint] = createSignal(false)

  // Cache Strategy:
  // Prefer Network (prefer always checking for new content first)
  // Prefer Cache (possibly faster if you've ever visted the page before)
  // Only Saved ();
  const runTimeDefault = "networkFirst"
  const cacheStrategyKey = "cacheStrategy"
  // note: these key/values correspond to translation.json files; Don't change them w/o changing those.   A union string type could be used, but wanted an actual object for runtime behavior.
  const cacheStrategies = {
    networkFirst: "cacheNetworkFirst",
    cacheFirst: "cacheFirst",
    cacheOnly: "cacheOnly"
  } as const
  let options = Object.entries(cacheStrategies)

  const [cacheStrategy, setCacheStrategy] = createSignal()
  onMount(async () => {
    const currentCacheStrategy = await get(cacheStrategyKey)
    // console.log({ currentCacheStrategy })
    currentCacheStrategy
      ? setCacheStrategy(currentCacheStrategy)
      : setCacheStrategy(runTimeDefault)
  })
  async function changeRunTimeCacheStrategy(
    strategy: keyof typeof cacheStrategies
  ) {
    if (!cacheStrategies[strategy]) return
    await set(cacheStrategyKey, strategy)

    setCacheStrategy(strategy)
  }

  async function printWholeBook() {
    setPreparingPrint(true)
    // get current book
    let currentBookObj = props.currentBookObj()
    debugger
    let promises: Array<Promise<string>> = []
    currentBookObj?.chapters.forEach((bibleChapObj) => {
      const promisedFetch = new Promise<string>(async (res, rej) => {
        if (bibleChapObj.text) return res(bibleChapObj.text) //already fetched
        let text = await props.fetchHtml({
          book: String(currentBookObj?.slug),
          chapter: bibleChapObj.label,
          skipAbort: true
        })
        if (text) {
          // ? batch mutate when done fetching or as we go?
          props.mutateStoreText({
            book: String(currentBookObj?.slug),
            chapter: String(bibleChapObj.label),
            val: String(text)
          })
          if (text) res(text)
        } else rej("error")
      })
      promises.push(promisedFetch)
    })
    Promise.all(promises).then((values) => {
      props.setPrintWholeBook(true)
      setPreparingPrint(false)
      window.print()
    })
    // fetch request for every chapter in current book
  }

  // createEffect(() => {
  //   console.log(cacheStrategy())
  // })
  return (
    <>
      <div>
        <details>
          <summary class="sentenceCase">{t("loadingBehavior")}</summary>
          <ul class="text-sm">
            <For each={options}>
              {(strategy) => {
                const key = strategy[0] as keyof typeof cacheStrategies
                const name = strategy[1]
                return (
                  <li>
                    <button
                      onClick={(e) => changeRunTimeCacheStrategy(key)}
                      class="my-2 ml-auto flex items-center text-right hover:text-accent focus:text-accent"
                    >
                      {t(name)}
                      <span
                        class={`${
                          cacheStrategy() == key
                            ? "border-accent bg-accent/70 text-accent"
                            : "border-gray-400"
                        } ml-2 inline-block rounded-full border  p-2`}
                      />
                    </button>
                  </li>
                )
              }}
            </For>
          </ul>
        </details>
      </div>
      <ul>
        <li class="my-2">
          <button
            class="sentenceCase hover:text-accent focus:text-accent"
            onClick={printWholeBook}
            disabled={preparingPrint()}
          >
            <Show when={preparingPrint()}>
              <svg
                class="mr-3 inline-block h-5 w-5 animate-spin text-accent"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </Show>
            {!preparingPrint()
              ? `${t("downloadPrintAll")}`
              : `${t("loading")}...`}
          </button>
        </li>
        <li class="my-2">
          {/* author/repo */}
          <a
            class="sentenceCase inline-block hover:text-accent focus:text-accent"
            href={`https://content.bibletranslationtools.org/${props.user}/${props.repo}/archive/master.zip`}
          >
            {t("downloadSource")}
          </a>
        </li>
      </ul>
    </>
  )
}
