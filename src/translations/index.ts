// originall this was going to be a barrell to reexport the langs and type them in i18n.ts, but I realized that if the language keys grew, it'd needless export them all the the browser.  This file ensures enough information to render the flags (svg in public flags must match this object) and languaage names.   Full dictionary is later loaded.  On initial load, the accepts language header is read and passed as the initial dicitionary to the i18n module:
export const langMeta = [
  {
    code: "en",
    name: "English"
  },
  {
    code: "es",
    name: "Español"
  }
]
