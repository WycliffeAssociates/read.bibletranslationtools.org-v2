import { createSignal, For, Setter } from "solid-js"
import type { tmSingle } from "@customTypes/types"

interface propsType {
  navigation: Array<tmSingle>
  initialPage: string
  isNested?: Boolean
  setNavIsOpen: Setter<boolean>
}

export function TMNav(props: propsType) {
  let isNested = !!props.isNested
  // function getToggleAriaAttrs(index: number, isExpanded: boolean) {
  //   return {
  //     id: `accordion_btn_${index}`,
  //     "aria-controls": `region_${index}`,
  //     "aria-expanded": isExpanded
  //   }
  // }

  // function getCollapseAriaAttrs(index: number) {
  //   return {
  //     id: `region_${index}`,
  //     role: "region",
  //     "aria-labelledby": `accordion_btn_${index}`
  //   }
  // }

  return (
    <nav>
      <ul>
        <For each={props.navigation}>
          {(navObj) => {
            return (
              <NavSection
                setNavIsOpen={props.setNavIsOpen}
                initialPage={props.initialPage}
                navObj={navObj}
                isNested={isNested}
              />
            )
          }}
        </For>
      </ul>
    </nav>
  )
}

interface NavSectionProps {
  navObj: tmSingle
  initialPage: string
  isNested: boolean
  setNavIsOpen: Setter<boolean>
}
function NavSection(props: NavSectionProps) {
  const isOpenFromProps =
    !props.isNested &&
    props.navObj.File.replace(".html", "") === props.initialPage
  const [isOpen, setIsOpen] = createSignal(isOpenFromProps)

  let heightRef: any
  function heightRefFxn() {
    let val = isOpen() ? `height: auto; ` : `height: 0;`
    return val
  }
  const hasChildren = props.navObj.Children.length
  return (
    <li class="navSection">
      <div class="flex">
        <NavSingleLink
          setNavIsOpen={props.setNavIsOpen}
          isNested={props.isNested}
          initialPage={props.initialPage}
          navObj={props.navObj}
        />
        <button
          aria-controls={`${props.navObj.Label}`}
          aria-expanded={isOpen()}
          onClick={() => {
            setIsOpen(!isOpen())
          }}
          class="flex"
        >
          {hasChildren ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class={`text-accentDarker ml-2 inline-block h-6 w-6 ${
                !isOpen() ? "-rotate-90" : ""
              }`}
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          ) : null}
        </button>
      </div>
      {hasChildren ? (
        <div
          class={`accordion-transition`}
          style={heightRefFxn()}
          aria-hidden={!isOpen()}
          id={`${props.navObj.Label}`}
          ref={heightRef}
        >
          <TMNav
            navigation={props.navObj.Children}
            initialPage={props.initialPage}
            isNested={true}
            setNavIsOpen={props.setNavIsOpen}
          />
        </div>
      ) : null}
    </li>
  )
}

function NavSingleLink(props: NavSectionProps) {
  let href = props.navObj.Slug
    ? `?section=${props.navObj.File.replace(".html", "")}#${props.navObj.Slug}`
    : `?section=${props.navObj.File.replace(".html", "")}`

  const isSameSection =
    props.initialPage === props.navObj.File.replace(".html", "")
  function onClick() {
    document.body.classList.remove("noscroll")
    props.setNavIsOpen(false)
  }
  if (isSameSection && !props.navObj.Slug) {
    return <span class="text-gray-800">{props.navObj.Label}</span>
  } else if (isSameSection && props.navObj.Slug) {
    return (
      <a onClick={onClick} class=" text-blue-700" href={href}>
        {props.navObj.Label}
      </a>
    )
  } else if (!isSameSection) {
    return (
      <a onClick={onClick} class="text-blue-700" href={href}>
        {props.navObj.Label}
      </a>
    )
  } else return <p> whoops!</p>
}
