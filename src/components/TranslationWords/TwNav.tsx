import { createSignal, For, Show } from "solid-js"
interface mobileTwNavProps {
  filteredWords: () => {
    slug: string
    label: string
    section: string
  }[]
  fetchSectionAndNav(event: Event, section: string, hash: string): Promise<void>
  searchWords(event: Event): void
}
export function MobileTwNav(props: mobileTwNavProps) {
  const [mobileNavIsOpen, setMobileNavIsOpen] = createSignal(false)

  return (
    <>
      <div
        class={` absolute top-0 right-0 z-10 ml-auto max-h-[50vh] w-full overflow-y-auto bg-white  sm:sticky sm:w-1/4 ${
          mobileNavIsOpen() && "shadow-dark-700 shadow"
        }`}
      >
        <div class="sticky top-0 flex content-center items-center bg-neutral-50">
          <div class="relative  mb-2 w-full">
            <Show when={mobileNavIsOpen()}>
              <button
                class="absolute top-2 right-12 rounded-lg border p-2  hover:text-red-600"
                onClick={() => setMobileNavIsOpen(false)}
              >
                <svg
                  data-id="closeXcircle"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="h-6 w-6"
                >
                  <path
                    fill-rule="evenodd"
                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </Show>
            <span
              class={`relative ${
                mobileNavIsOpen() ? "mt-14" : "mt-2"
              }  inline-block w-full`}
            >
              <svg
                data-id="mangifying-glass"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="absolute top-1/2 left-4 h-6 w-6 -translate-y-1/2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>

              <input
                type="text"
                class="mx-auto ml-1 inline-block w-11/12 rounded-full border  p-1 py-4 pl-10  text-darkAccent "
                placeholder="Search words.."
                onInput={(ev) => props.searchWords(ev)}
                onFocus={() => setMobileNavIsOpen(true)}
              />
            </span>
          </div>
        </div>
        <Show when={mobileNavIsOpen()}>
          <ul class="mt-2">
            <For each={props.filteredWords()}>
              {(word) => {
                return (
                  <li class=" ">
                    <a
                      class="ml-2 inline-block px-1 py-2 text-accent underline"
                      onClick={(e) => {
                        props.fetchSectionAndNav(e, word.section, word.slug)
                        setMobileNavIsOpen(false)
                      }}
                      href={`?section=${word.section}#${word.slug}`}
                      data-section={word.section}
                      data-hash={word.slug}
                    >
                      {word.label}
                    </a>
                  </li>
                )
              }}
            </For>
          </ul>
        </Show>
      </div>
    </>
  )
}

export function BeyondSmallNav(props: mobileTwNavProps) {
  return (
    <>
      <div class="sticky top-0 flex content-center items-center bg-neutral-50">
        <input
          type="text"
          class="mt-2 ml-1 inline-block w-11/12 rounded-full  border p-2 py-4  text-darkAccent sm:mt-4"
          placeholder="Search words.."
          onInput={(ev) => props.searchWords(ev)}
        />
      </div>

      <ul class="mt-2">
        <For each={props.filteredWords()}>
          {(word) => {
            return (
              <li class=" ">
                <a
                  class="ml-2 inline-block px-1 py-2 text-accent underline"
                  onClick={(e) =>
                    props.fetchSectionAndNav(e, word.section, word.slug)
                  }
                  href={`?section=${word.section}#${word.slug}`}
                  data-section={word.section}
                  data-hash={word.slug}
                >
                  {word.label}
                </a>
              </li>
            )
          }}
        </For>
      </ul>
    </>
  )
}
