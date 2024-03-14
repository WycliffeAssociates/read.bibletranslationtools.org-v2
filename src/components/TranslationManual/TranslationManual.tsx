import { HamburgerSvg } from "@components/global/Nav/MenuButtons";
import type { tmProps } from "@src/customTypes/types";
import { createSignal, Show } from "solid-js";
import { TMNav } from "./TmNav";

export default function TranslationManual(props: tmProps) {
  const [navIsOpen, setNavIsOpen] = createSignal(false);

  return (
    <div class="h-full border-x border-gray-200 bg-white px-4 md:px-4 md:py-4">
      <div class="sticky top-0 z-20 pt-4 md:hidden md:pt-0 ">
        <button
          class={`ml-auto flex items-center gap-2 rounded-md border border-solid  border-white bg-darkAccent px-4 py-2 capitalize text-white md:hidden rtl:flex-row-reverse ${
            navIsOpen() && "hidden"
          }`}
          onClick={() => {
            setNavIsOpen(!navIsOpen());
            document.body.classList.toggle("noscroll");
          }}
        >
          See outline <HamburgerSvg classNames="fill-white" />
        </button>
      </div>
      <div
        class={`relative flex h-full justify-between  ${
          navIsOpen() ? "overflow-hidden" : "overflow-y-scroll"
        }`}
      >
        {props.initialHtml && (
          <div
            class={`theText mr-auto h-full w-full max-w-[70ch] md:w-4/5 lg:w-3/5`}
            innerHTML={props.initialHtml}
          />
        )}
        {props.repoIndex.navigation?.length && (
          <div class="h-full w-0  md:sticky md:top-0 md:w-2/5 md:bg-transparent lg:w-1/5">
            <Show when={navIsOpen()}>
              <button
                class="fixed right-8 top-8 z-20 flex items-center gap-2 rounded-md border border-solid border-white  bg-darkAccent px-4 py-2 capitalize text-white md:hidden rtl:flex-row-reverse "
                onClick={() => {
                  setNavIsOpen(!navIsOpen());
                  document.body.classList.toggle("noscroll");
                }}
              >
                Close outline <HamburgerSvg classNames="fill-white" />
              </button>
            </Show>
            <nav
              aria-label="Translation Manual Navigation"
              class={`fixed inset-0 z-10 h-[var(--screenHeight)] w-full overflow-y-scroll px-4  md:sticky md:top-0 md:block md:h-full md:bg-none md:pt-0 ${
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
  );
}
