import type { JSXElement } from "solid-js"

interface navProps {
  classNames?: string
  fallback?: boolean
  user?: string
  repo?: string
  book?: string
  chapter?: number
  onClick?: { (args?: any): any }
  icon?: JSXElement
  dir?: "BACK" | "FORWARD"
  // children: JSXElement
}

const mobileGradient =
  "z-10 bg-gradient-to-b from-[rgba(0,0,0,0)] to-[rgba(255,255,255,.8)]"
const backwardClassNamesDiv = `${mobileGradient} w-full p-4 sm:p-0 bottom-0 left-0 absolute print:hidden md:bg-none md:h-full md:w-16 md:static`
const backwardClassA =
  "rounded-full bg-neutral-50 border-zinc-300 h-14 shadow-xl text-center grid shadow-dark-700 w-14 place-content-center md:bg-transparent md:border-none md:rounded-none md:h-full md:shadow-none md:w-16 text-slate-400 hover:text-accent focus:text-accent  cursor-pointer"

const forwardClassNamesDiv = `${mobileGradient} p-4 sm:p-0 right-0 bottom-0 absolute print:hidden md:h-full  md:static`

const forwardClassNamesA =
  "border border-solid rounded-full ml-auto  bg-neutral-50 border-zinc-300 h-14 shadow-xl text-center grid shadow-dark-700 w-14 place-content-center md:border-none md:rounded-none md:h-full md:bg-zinc-200 md:shadow-none md:w-16 hover:text-accent focus:text-accent md:text-slate-800 cursor-pointer"

export default function NavButtonLinks(props: navProps) {
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
        href={`${import.meta.env.PUBLIC_READER_URL}/${props.user}/${
          props.repo
        }/?book=${props.book}&chapter=${Number(props.chapter)}`}
        class={`${props.dir == "BACK" ? backwardClassA : forwardClassNamesA}`}
        onClick={props.onClick}
      >
        {props.icon}
      </a>
    </div>
  )
}
