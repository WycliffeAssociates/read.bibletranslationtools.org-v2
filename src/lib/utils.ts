import { type i18nDictKeysType, i18nDictMeta } from "@lib/i18n";
import type { repoIndexObj } from "@customTypes/types";

/**
 * @param request an Astro request. The accepts language header will be referenced against existing locales
 * @returns The first locale in header for which a translation exists, or the default
 */
export function getPreferredLangFromHeader(request: Request): i18nDictKeysType {
  const defaultLocale = "en";
  if (!request) return defaultLocale;
  const langs = request.headers.get("Accept-Language");
  if (!langs) return defaultLocale;
  const langsArr = langs.split(",").map((lang) => {
    const arr = lang.split(";");
    return arr[0];
  });
  let preferredLocale = defaultLocale; //default
  for (let i = 0; i < langsArr.length; i++) {
    const langKey = langsArr[i] as i18nDictKeysType;
    const matchedLocale = i18nDictMeta.find(
      (locale) => locale.code === langKey
    );
    if (matchedLocale) {
      preferredLocale = langKey;
      break;
    } else continue;
  }
  return preferredLocale as i18nDictKeysType;
}

interface bookChapterRequest {
  book: string | null;
  chapter: string | null;
  repoIndex: repoIndexObj;
}

export function getBookAndChapterFromUrl({
  book,
  chapter,
  repoIndex
}: bookChapterRequest): {
  book: string;
  chapter: string;
} {
  if (!repoIndex.bible?.length) {
    // return an object of same ts shape, but falsy vals
    return {
      book: "",
      chapter: ""
    };
  }
  const firstBibBook = repoIndex.bible[0]; //use first Key;
  const firstBibBookChap = chapter || firstBibBook.chapters[0].label;
  const bookToSearch = book || firstBibBook.slug;
  // most things in app use slug.  But for initial render, its fine to check for if the whole book label was passed instead of only slug
  let matchingBook = repoIndex.bible?.find(
    (repoBook) => repoBook.slug.toLowerCase() == bookToSearch.toLowerCase()
  );
  if (!matchingBook) {
    // Fallback to use first book;
    matchingBook = repoIndex.bible?.find(
      (repoBook) =>
        repoBook.label.toLowerCase() == firstBibBook.label.toLowerCase()
    );
  }
  const matchingChapter =
    matchingBook &&
    matchingBook.chapters.find(
      (chapterObj) => chapterObj.label == firstBibBookChap
    );
  if (!matchingBook) {
    book = null;
    chapter = null;
  } else if (chapter && !matchingChapter) {
    // there is a book, and chap provided but this verfies that it is a a valid book/chap ;  Only set chap to null cause we can still use the book
    chapter = null;
  }
  const firstBookToRender = matchingBook || repoIndex.bible[0]; //use first Key;
  const firstChapterToShow = matchingChapter || firstBookToRender.chapters[0];

  return {
    book: firstBookToRender.slug || "",
    chapter: firstChapterToShow.label || ""
  };
}

interface nonBibSchemaI {
  navParam: string | null;
  repoIndex: repoIndexObj;
}

export function getTwQueryParamOrDefault({
  navParam,
  repoIndex
}: nonBibSchemaI): string | void {
  if (!repoIndex.words?.length) return;
  const defaultNavParam = repoIndex.words[0].slug;
  if (!repoIndex || !navParam) return defaultNavParam;
  const match = repoIndex.words.find((wordObj) => wordObj.slug === navParam);
  if (match) {
    return match.slug;
  } else {
    return defaultNavParam;
  }
}
export function getTmQueryParamOrDefault({
  navParam,
  repoIndex
}: nonBibSchemaI): string | void {
  if (!repoIndex.navigation?.length) return;
  const defaultNavParam = repoIndex.navigation[0].File?.replace(".html", "");
  const matchingObj = repoIndex.navigation.find((topLevelNavObj) => {
    return topLevelNavObj.File.replace(".html", "") == navParam;
  });
  return matchingObj && matchingObj.File
    ? matchingObj.File.replace(".html", "")
    : defaultNavParam;
}

interface IReshapeBibleIndex {
  repoIndex: repoIndexObj;
  book: string;
  chapter: string;
  initialHtml: string | null;
}

export function seedAndMutateInitialDataRepoIndex({
  repoIndex,
  book,
  chapter,
  initialHtml
}: IReshapeBibleIndex): void {
  if (!repoIndex.bible) return;
  repoIndex.bible.forEach((repoBook) => {
    repoBook.chapters.forEach((repoChapter) => {
      repoChapter.content = null;
      if (repoBook.slug == book && repoChapter.label == chapter) {
        repoChapter.content = initialHtml;
      }
    });
  });
}

export function intlDate(
  timestring: string,
  locale: string | string[],
  options: Intl.DateTimeFormatOptions
) {
  const date = new Date(timestring);
  return new Intl.DateTimeFormat(locale, options).format(date);
}
