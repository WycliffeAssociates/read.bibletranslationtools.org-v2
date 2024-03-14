import { type JSXElement, Show } from "solid-js";

interface navProps {
  classNames?: string;
  fallback?: boolean;
  user?: string;
  repo?: string;
  book?: string;
  chapter?: string;
  // Next line: any really is fine here.  User defines the click behavior.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick?: (...args: any) => unknown;
  icon?: JSXElement;
  dir?: "BACK" | "FORWARD";
}

const mobileGradient =
  "z-10 bg-gradient-to-b from-[rgba(0,0,0,0)] to-[rgba(255,255,255,.8)]";
const backwardClassNamesDiv = `${mobileGradient} text-base w-full p-4  bottom-0 ltr:left-[max(0vw,_((100vw-115ch)/2))] rtl:right-0  print:hidden   fixed `;
const forwardClassNamesDiv = `${mobileGradient} text-base p-4  ltr:right-[max(0vw,_((100vw-110ch)/2))] rtl:left-0 bottom-0  print:hidden    fixed`;

const backwardClassA =
  "rounded-xl bg-neutral-50 border-zinc-300 h-14 shadow-[0_1px_3px_rgba(0,21,51,.12),_0px_1px_2px_rgba(0,21,51,.24)] text-center grid shadow-dark-800 w-14 place-content-center  hover:text-accent focus:text-accent  cursor-pointer  ";

const forwardClassNamesA =
  "border border-solid rounded-xl ml-auto shadow-[0_1px_3px_rgba(0,21,51,.12),_0px_1px_2px_rgba(0,21,51,.24)] bg-neutral-50 border-zinc-300 h-14  text-center grid shadow-dark-800 w-14 place-content-center  hover:text-accent focus:text-accent  cursor-pointer ";

export default function NavButtonLinks(props: navProps) {
  return (
    <>
      <Show when={!props.fallback}>
        <div
          class={`${
            props.dir == "BACK" ? backwardClassNamesDiv : forwardClassNamesDiv
          }`}
        >
          <a
            data-testid={props.dir !== "BACK" ? "NavForwardBtn" : "NavBackBtn"}
            href={`/${props.user}/${props.repo}/?book=${props.book}&chapter=${props.chapter}`}
            class={`${
              props.dir == "BACK" ? backwardClassA : forwardClassNamesA
            }`}
            onClick={(e) => props.onClick && props.onClick(e)}
          >
            {props.icon}
          </a>
        </div>
      </Show>
    </>
  );
}
