import type { JSX } from "solid-js"

interface IDetailItem {
  icon: JSX.Element
  header: string
  detail: string
}
export default function DetailItem(props: IDetailItem) {
  return (
    <li class="flex items-start gap-4">
      <span class="inline-flex h-12 w-12 items-center justify-center rounded-md  text-accent">
        {props.icon}
      </span>
      <div>
        <p class="text-gray-400">{props.header}</p>
        <p class="text-xl text-slate-700">{props.detail}</p>
      </div>
    </li>
  )
}
