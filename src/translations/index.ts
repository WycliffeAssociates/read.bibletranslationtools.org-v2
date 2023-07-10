// This file ensures enough information to render the flags (svg name in public folder of flags must match this object code) and it gives the langauge name.  Additional dictionaries are later loaded only if needed on request.  On initial load, the accepts language header is read and passed as the initial dicitionary to the i18n module:
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
