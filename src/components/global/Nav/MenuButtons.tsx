export function MobileMenuOpen(props: { classNames?: string }) {
  return (
    <>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class={`${props.classNames || ""}`}
        // class="mr-2 inline-block"
      >
        <path
          d="M14 0.666656C21.3733 0.666656 27.3333 6.62666 27.3333 14C27.3333 21.3733 21.3733 27.3333 14 27.3333C6.62667 27.3333 0.666672 21.3733 0.666672 14C0.666672 6.62666 6.62667 0.666656 14 0.666656ZM18.7867 7.33332L14 12.12L9.21334 7.33332L7.33334 9.21332L12.12 14L7.33334 18.7867L9.21334 20.6667L14 15.88L18.7867 20.6667L20.6667 18.7867L15.88 14L20.6667 9.21332L18.7867 7.33332Z"
          fill="white"
          fill-opacity="0.8"
        />
      </svg>
    </>
  )
}

export function HamburgerSvg(props: { classNames?: string }) {
  return (
    <svg
      width="25"
      height="16"
      viewBox="0 0 25 16"
      fill="none"
      class={`${props.classNames || "fill-current"}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.5 0H24.5V2.66667H0.5V0ZM0.5 6.66667H24.5V9.33333H0.5V6.66667ZM0.5 13.3333H24.5V16H0.5V13.3333Z"
        fill=""
        fill-opacity="0.8"
      />
    </svg>
  )
}
