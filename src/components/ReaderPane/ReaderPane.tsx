import {
  onMount,
  Show,
  createEffect,
  on,
  batch,
  type Accessor
} from "solid-js";
import { SvgArrow } from "@components";
import NavButtonLinks from "./NavButtons";
import type { storeType } from "../ReaderWrapper/ReaderWrapper";
import {
  PreviewPane,
  hoverOnCrossReferences,
  hoverOnFootnotes,
  hoverOnCommentaryCrossReferences
} from "./PreviewPane";

interface ReaderPaneProps {
  storeInterface: storeType;
  user: string;
  repositoryName: string;
  firstBookKey: string;
  firstChapterToShow: string;
  printWholeBook: Accessor<boolean>;
}

export default function ReaderPane(props: ReaderPaneProps) {
  // for footnote
  let textRef: HTMLDivElement | undefined;

  // maybe: extract to shared ui Utils and run on the layout level:
  function setLastPageVisited() {
    const setLastEvent = new CustomEvent("setLastPageVisited", {
      detail: {
        url: location.href
      }
    });
    const commonWrapper = document.querySelector("#commonWrapper");
    commonWrapper && commonWrapper.dispatchEvent(setLastEvent);
  }

  createEffect(
    on(
      () => props.storeInterface.getStoreVal("currentChapter"),
      () => {
        if (!props.storeInterface.HTML()) return;
        preFetchAdjacent();
        hoverOnFootnotes();
        hoverOnCrossReferences();
        hoverOnCommentaryCrossReferences(props.user, props.repositoryName);
        pushHistory(
          props.storeInterface.getStoreVal("currentBook"),
          props.storeInterface.getStoreVal("currentChapter")
        );
      }
    )
  );
  onMount(() => {
    // popstate is history push.  since most navs are ajax, we want to manually make sure that we are trigger a "nav" or sorts on popstates
    window.addEventListener("popstate", () => {
      // maybe: add popstate logic  to other templates or at layout level?
      const params = new URLSearchParams(location.search);
      const chapter = params.get("chapter");
      if (chapter) {
        fetchReaderHtml({
          navigate: true,
          chapNum: chapter
        });
      }
    });
  });

  async function preFetchAdjacent() {
    const currentChap =
      props.storeInterface.getStoreVal<string>("currentChapter");

    const nextCh = Number(currentChap) + 1;
    const prevCh = Number(currentChap) - 1;
    await fetchReaderHtml({ chapNum: nextCh });
    await fetchReaderHtml({ chapNum: prevCh });
  }

  function pushHistory(currentBook: string, currentChap: string) {
    if ("URLSearchParams" in window) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set("book", currentBook);
      searchParams.set("chapter", currentChap);
      const hash = window.location.hash || "";
      const newRelativePathQuery =
        window.location.pathname + "?" + searchParams.toString() + hash;
      document.title = `${props.repositoryName}-${currentBook}-${currentChap}`;
      history.pushState(
        {
          newUrl: newRelativePathQuery
        },
        "",
        newRelativePathQuery
      );

      if (hash) {
        const el = document.querySelector(hash);
        el?.scrollIntoView({
          block: "center",
          inline: "start"
        });
      }
    }
    setLastPageVisited();
  }

  type fetchReaderParams = {
    event?: Event;
    navigate?: boolean;
    dir?: "BACK" | "FORWARD";
    chapNum?: number | string;
  };
  function scrollToTop() {
    const scrollPane = document.querySelector('[data-js="scrollToTop"]');
    if (scrollPane) {
      scrollPane.scrollTop = 0;
    }
  }
  async function fetchReaderHtml({
    event,
    navigate,
    dir,
    chapNum
  }: fetchReaderParams) {
    event && event.preventDefault();
    const currentBook = props.storeInterface.getStoreVal<string>("currentBook");

    if (chapNum && Number(chapNum) <= 0 && !dir) return;
    let nextCh: number | string | undefined;
    // Decide next chapter, whether given or sequential;
    if (chapNum) {
      nextCh = chapNum;
    } else if (dir === "BACK") {
      nextCh = props.storeInterface.navLinks()?.prev;
    } else {
      nextCh = props.storeInterface.navLinks()?.next;
    }
    // return if navLinks didn't return a valid nextCh
    if (!nextCh) {
      return;
    }
    // Check for existing in memory;
    nextCh = String(nextCh); //all store keys are strings; Nums only for math
    const currentBookObj = props.storeInterface.currentBookObj();
    // handles index offset:
    const existingChap = currentBookObj
      ? props.storeInterface.getChapObjFromGivenBook(
          currentBookObj.slug,
          nextCh
        )
      : null;

    const existingText = existingChap?.content; //html if put there;
    if (!existingChap) return;
    if (existingText && navigate) {
      scrollToTop();
      return props.storeInterface.mutateStore("currentChapter", nextCh);
    } else if (existingText) {
      return;
    }

    // no existing text -- fetch next html;
    const params = {
      book: currentBook,
      chapter: nextCh
    };

    const text = await props.storeInterface.fetchHtml(params);
    if (!text) return;

    // Batch some state updates to notified memos at end of stateful updates
    batch(() => {
      props.storeInterface.mutateStoreText({
        book: currentBook,
        chapter: String(existingChap?.label),
        val: String(text)
      });
      if (navigate) {
        props.storeInterface.mutateStore("currentChapter", String(nextCh));
        scrollToTop();
      }
    });

    return;
  }

  return (
    <>
      {/* HTML CONTENT */}
      <Show when={!props.printWholeBook()}>
        <PreviewPane />
        <div class="mx-auto  w-full ">
          <div class="relative flex  h-full content-center  justify-center gap-2 bg-[--clrBackground]">
            <Show
              when={props.storeInterface.navLinks()?.prev}
              fallback={<NavButtonLinks fallback={true} />}
            >
              <NavButtonLinks
                dir={"BACK"}
                user={props.user}
                repo={props.repositoryName}
                book={props.firstBookKey}
                chapter={props.storeInterface.navLinks()?.prev}
                onClick={(event: Event) => {
                  fetchReaderHtml({ event, navigate: true, dir: "BACK" });
                }}
                icon={
                  <span class="w-4">
                    <SvgArrow classNames="color-inherit mx-auto fill-current stroke-current ltr:rotate-0 rtl:rotate-180 w-full block" />
                  </span>
                }
              />
            </Show>
            {/* top buttons */}
            <div
              id="theText"
              ref={textRef}
              class="theText mx-auto mb-24 h-full max-w-[75ch] overflow-y-auto   bg-inherit bg-white p-2  text-lg text-varBase leading-[185%]  text-[--color-text]  sm:px-8  sm:pt-2 md:w-full print:h-min print:overflow-y-visible  print:pb-4"
              innerHTML={props.storeInterface.HTML()}
            />

            {/* lower stuff */}
            <Show
              when={props.storeInterface.navLinks()?.next}
              fallback={<NavButtonLinks fallback={true} />}
            >
              <NavButtonLinks
                dir={"FORWARD"}
                user={props.user}
                repo={props.repositoryName}
                book={props.firstBookKey}
                chapter={props.storeInterface.navLinks()?.next}
                // eslint-disable-next-line solid/reactivity
                onClick={(event: Event) => {
                  fetchReaderHtml({ event, navigate: true, dir: "FORWARD" });
                }}
                icon={
                  <span class="w-4">
                    <SvgArrow classNames="color-inherit mx-auto fill-current stroke-current ltr:rotate-180 rtl:rotate-0" />
                  </span>
                }
              />
            </Show>
          </div>
        </div>
        {/* lower stuff */}
      </Show>

      {/* whole book gets own pane*/}
      <Show when={props.printWholeBook()}>
        <div
          id="wholeBook"
          innerHTML={props.storeInterface.getStoreVal("printHtml")}
          class=" theText mx-auto  h-max  max-w-[75ch] !overflow-y-visible bg-inherit bg-white text-lg leading-[185%] text-[--color-text] text-black print:pb-4  
        "
        />
      </Show>
    </>
  );
}
