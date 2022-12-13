import { HamburgerSvg } from "@components/global/Nav/MenuButtons"
import type { tmProps, tmSingle } from "@src/customTypes/types"
import { createSignal, JSX, Show } from "solid-js"
import { TMNav } from "./TmNav"

export default function TranslationManual(props: tmProps) {
  console.log(props.initialPage)
  const [navIsOpen, setNavIsOpen] = createSignal(false)

  // debugger

  return (
    <div class="h-full px-4 md:px-4 md:py-4">
      <div class="sticky top-0 z-20 pt-4 md:hidden md:pt-0">
        <button
          class={`ml-auto flex items-center gap-2 rounded-md border border-solid  border-white bg-darkAccent px-4 py-2 capitalize text-white rtl:flex-row-reverse md:hidden ${
            navIsOpen() && "hidden"
          }`}
          onClick={() => {
            setNavIsOpen(!navIsOpen())
            document.body.classList.toggle("noscroll")
          }}
        >
          See outline <HamburgerSvg classNames="fill-white" />
        </button>
      </div>
      <div
        class={`relative flex h-full justify-between ${
          navIsOpen() ? "overflow-hidden" : "overflow-y-scroll"
        }`}
      >
        <div
          class={`theText mr-auto h-full w-full max-w-[70ch] md:w-4/5 lg:w-3/5`}
          innerHTML={props.initialHtml}
        ></div>
        {props.repoIndex.navigation?.length && (
          <div class="h-full w-0  md:sticky md:top-0 md:w-2/5 md:bg-transparent lg:w-1/5">
            <Show when={navIsOpen()}>
              <button
                class="fixed top-8 right-8 z-20 flex items-center gap-2 rounded-md border border-solid border-white  bg-darkAccent px-4 py-2 capitalize text-white rtl:flex-row-reverse md:hidden "
                onClick={() => {
                  setNavIsOpen(!navIsOpen())
                  document.body.classList.toggle("noscroll")
                }}
              >
                Close outline <HamburgerSvg classNames="fill-white" />
              </button>
            </Show>
            <nav
              aria-label="Translation Manual Navigation"
              class={`fixed inset-0 z-10 h-screen w-full overflow-y-scroll bg-neutral-50 px-4  md:sticky md:top-0 md:block md:h-full md:bg-none md:pt-0 ${
                navIsOpen() ? "block pt-24" : "hidden"
              }`}
            >
              <div class="h-full">
                <TMNav
                  navigation={props.repoIndex.navigation}
                  initialPage={props.initialPage}
                  setNavIsOpen={setNavIsOpen}
                />
              </div>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}
