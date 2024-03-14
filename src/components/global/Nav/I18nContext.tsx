import type { i18nDictKeysType } from "@lib/i18n";

export async function addDict(langCode: i18nDictKeysType) {
  const newLang = await import(`../../../translations/${langCode}.js`);
  const newDict = newLang.default;
  return { newDictCode: newDict.code, newDict };
}
