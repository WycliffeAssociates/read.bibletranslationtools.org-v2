interface iconProps {
  classNames?: string
}

export function SvgDownload(props: iconProps) {
  return (
    <svg
      width="14"
      height="17"
      viewBox="0 0 14 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class={props.classNames}
    >
      <path
        d="M0 17H14V15H0V17ZM14 6H10V0H4V6H0L7 13L14 6Z"
        fill="#001533"
        fill-opacity="0.8"
      />
    </svg>
  )
}
export function SvgSettings(props: iconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class={`${props.classNames} h-6 w-6 `}
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}

export function SvgArrow(props: iconProps) {
  return (
    <svg
      width="16"
      height="17"
      viewBox="0 0 16 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class={props.classNames}
    >
      <path
        d="M16 7.5V9.5H3.99997L9.49997 15L8.07997 16.42L0.159973 8.5L8.07997 0.580002L9.49997 2L3.99997 7.5H16Z"
        fill-opacity="0.8"
      />
    </svg>
  )
}
export function SvgSearch(props: iconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class={props.classNames}
    >
      <path
        d="M8.66667 0C10.9652 0 13.1696 0.913092 14.7949 2.53841C16.4202 4.16372 17.3333 6.36812 17.3333 8.66667C17.3333 10.8133 16.5467 12.7867 15.2533 14.3067L15.6133 14.6667H16.6667L23.3333 21.3333L21.3333 23.3333L14.6667 16.6667V15.6133L14.3067 15.2533C12.7341 16.5957 10.7343 17.3332 8.66667 17.3333C6.36812 17.3333 4.16372 16.4202 2.53841 14.7949C0.913092 13.1696 0 10.9652 0 8.66667C0 6.36812 0.913092 4.16372 2.53841 2.53841C4.16372 0.913092 6.36812 0 8.66667 0ZM8.66667 2.66667C5.33333 2.66667 2.66667 5.33333 2.66667 8.66667C2.66667 12 5.33333 14.6667 8.66667 14.6667C12 14.6667 14.6667 12 14.6667 8.66667C14.6667 5.33333 12 2.66667 8.66667 2.66667Z"
        fill-opacity="0.8"
      />
    </svg>
  )
}

export function SvgBook(props: iconProps) {
  return (
    <svg
      width="16"
      height="20"
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class={props.classNames}
    >
      <path
        d="M14 20C14.5304 20 15.0391 19.7893 15.4142 19.4142C15.7893 19.0391 16 18.5304 16 18V2C16 1.46957 15.7893 0.960859 15.4142 0.585786C15.0391 0.210714 14.5304 0 14 0H8V7L5.5 5.5L3 7V0H2C1.46957 0 0.960859 0.210714 0.585786 0.585786C0.210714 0.960859 0 1.46957 0 2V18C0 18.5304 0.210714 19.0391 0.585786 19.4142C0.960859 19.7893 1.46957 20 2 20H14Z"
        fill-opacity="0.8"
      />
    </svg>
  )
}
export function LoadingSpinner(props: iconProps) {
  return (
    <svg
      class={`animate-spin ${props.classNames}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
