import type { JSXElement } from "solid-js"
import { useI18n } from "@solid-primitives/i18n"

interface navProps {
  classNames?: string
  fallback?: boolean
  user?: string
  repo?: string
  book?: string
  chapter?: string
  onClick?: (...args: any[]) => any
  icon?: JSXElement
  dir?: "BACK" | "FORWARD"
  // children: JSXElement
}

const mobileGradient =
  "z-10 bg-gradient-to-b from-[rgba(0,0,0,0)] to-[rgba(255,255,255,.8)]"
const backwardClassNamesDiv = `${mobileGradient} w-full p-4 md:p-0 bottom-0 ltr:left-0 rtl:right-0  print:hidden md:bg-none md:h-full md:w-16 md:static fixed`
const forwardClassNamesDiv = `${mobileGradient} p-4 md:p-0 ltr:right-0 rtl:left-0 bottom-0  print:hidden md:bg-none md:h-full  md:w-16 md:static fixed`

const backwardClassA =
  "rounded-full bg-neutral-50 border-zinc-300 h-14 shadow-xl text-center grid shadow-dark-700 w-14 place-content-center md:border-none md:rounded-none md:h-full md:bg-zinc-200 md:shadow-none md:w-16 hover:text-accent focus:text-accent md:text-slate-800 cursor-pointer md:fixed "

const forwardClassNamesA =
  "border border-solid rounded-full ml-auto  bg-neutral-50 border-zinc-300 h-14 shadow-xl text-center grid shadow-dark-700 w-14 place-content-center md:border-none md:rounded-none md:h-full md:bg-zinc-200 md:shadow-none md:w-16 hover:text-accent focus:text-accent md:text-slate-800 cursor-pointer md:fixed"

export default function NavButtonLinks(props: navProps) {
  const [t] = useI18n()

  if (props.fallback) {
    return (
      <div class="hidden h-full  w-16 flex-shrink-0 print:hidden sm:block">
        {" "}
      </div>
    )
  }
  return (
    <div
      class={`${
        props.dir == "BACK" ? backwardClassNamesDiv : forwardClassNamesDiv
      }`}
    >
      <a
        data-testid={props.dir !== "BACK" ? "NavForwardBtn" : "NavBackBtn"}
        aria-label={
          props.dir !== "BACK"
            ? t("ariaNavigateForwardsOneChapter")
            : t("ariaNavigateBackwardsOneChapter")
        }
        href={`/${props.user}/${props.repo}/?book=${props.book}&chapter=${props.chapter}`}
        class={`${props.dir == "BACK" ? backwardClassA : forwardClassNamesA}`}
        onClick={props.onClick}
      >
        {props.icon}
      </a>
    </div>
  )
}
