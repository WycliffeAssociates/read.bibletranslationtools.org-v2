import { Dynamic } from "solid-js/web"

interface ISectionHeader {
  text: string
  component: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  className?: string
}
export default function SectionHeader(props: ISectionHeader) {
  const defaultClass = "mb-1 text-lg font-bold"
  return (
    <Dynamic
      class={`${defaultClass} ${props.className || ""}`}
      component={props.component}
    >
      {props.text}
    </Dynamic>
  )
}
