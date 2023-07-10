export const BibleBookCategories = {
  OT: [
    "GEN",
    "EXO",
    "LEV",
    "NUM",
    "DEU",
    "JOS",
    "JDG",
    "RUT",
    "1SA",
    "2SA",
    "1KI",
    "2KI",
    "1CH",
    "2CH",
    "EZR",
    "NEH",
    "EST",
    "JOB",
    "PSA",
    "PRO",
    "ECC",
    "SNG",
    "ISA",
    "JER",
    "LAM",
    "EZK",
    "DAN",
    "HOS",
    "JOL",
    "AMO",
    "OBA",
    "JON",
    "MIC",
    "NAM",
    "HAB",
    "ZEP",
    "HAG",
    "ZEC",
    "MAL"
  ],
  NT: [
    "MAT",
    "MRK",
    "LUK",
    "JHN",
    "ACT",
    "ROM",
    "1CO",
    "2CO",
    "GAL",
    "EPH",
    "PHP",
    "COL",
    "1TH",
    "2TH",
    "1TI",
    "2TI",
    "TIT",
    "PHM",
    "HEB",
    "JAS",
    "1PE",
    "2PE",
    "1JN",
    "2JN",
    "3JN",
    "JUD",
    "REV"
  ]
}
interface sortOrderI {
  [key: string]: number
}
const bibleBookSortOrder = Object.values(BibleBookCategories)
  .flat()
  .reduce((acc: sortOrderI, value: string, index: number) => {
    acc[value] = index + 1
    return acc
  }, {})
export { bibleBookSortOrder }

export const resourceSizeQueryParameters = {
  book: "book",
  whole: "whole"
} as const

// todo: increment these when changing any of the tsx files since that will likely change any affected css, and built js hashes.
// NOTE: cloudflare doesn't cache html pages by default since they are assumed to be dynamic. The default for static CSS/JS is 4 hours. If the hashes change on those css/js files between builds, and this cache references css/js that doesn't exist, you'll get a mismatch of assets that leads to a broken (unstyled) page.  It can be fixed with hard refresh though since that will update the cache.  But for the sake of trying to avoid those broken loads on caches, increment this cache versions between builds or a way to bust the document cache when new service workers register.
const htmlCacheVersion = 1
export const CACHENAMES = {
  complete: "row-completes",
  lrApi: "live-reader-api",
  lrPagesCache: `lr-pages-${htmlCacheVersion}`
}
