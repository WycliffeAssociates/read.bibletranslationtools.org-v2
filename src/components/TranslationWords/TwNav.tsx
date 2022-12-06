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
  return (
    <>
      <div class="absolute top-0 right-0 z-10 ml-auto max-h-[50vh] w-full overflow-y-auto bg-white sm:sticky sm:w-1/4">
        <div class="sticky top-0 flex content-center items-center bg-neutral-50">
          <button class="mt-2 ">mm</button>
          <input
            type="text"
            class="mt-2 ml-1 inline-block w-11/12 rounded-full  border p-2 py-4  text-darkAccent sm:mt-4"
            placeholder="Search words.."
            onInput={props.searchWords}
          />
        </div>

        <ul class="mt-2">
          {props.filteredWords().map((word) => {
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
          })}
        </ul>
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
          onInput={props.searchWords}
        />
      </div>

      <ul class="mt-2">
        {props.filteredWords().map((word) => {
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
        })}
      </ul>
    </>
  )
}
