// import ReloadPrompt from "./serviceWorker/ReloadPrompt"
import { SvgBook } from "./Icons/Icons"

// export { default as Card } from "./Card.astro"

export { default as Card } from "./Card.astro"
export { default as ReloadPrompt } from "./serviceWorker/ReloadPrompt.astro"
export { default as TestComponent } from "./Test"
export { default as Nav } from "./global/Nav/Nav.astro"
export {
  SvgDownload,
  SvgArrow,
  SvgSearch,
  SvgBook,
  SvgSettings,
  LoadingSpinner
} from "./Icons/Icons"
export { default as ReaderMenu } from "./ReaderMenu/ReaderMenu"
export { default as ReaderPane } from "./ReaderPane/ReaderPane"
export { default as ReaderWrapper } from "./ReaderWrapper/ReaderWrapper"
export { default as TranslationWords } from "./TranslationWords/Tw"
export { default as TranslationManual } from "./TranslationManual/TranslationManual"
// settings Component is lazy loaded
