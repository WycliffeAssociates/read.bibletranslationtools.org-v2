import { RadioGroup, Button } from "@kobalte/core"
import { For, Resource, Setter, createSignal } from "solid-js"
import SectionHeader from "./SectionHeader"
import { useI18n } from "@solid-primitives/i18n"
import type { storeType } from "@components/ReaderWrapper/ReaderWrapper"
import type {
  ISavedInServiceWorkerStatus,
  bibleEntryObj,
  repoIndexObj
} from "@customTypes/types"
import { getWholeBook, getWholeResource } from "@lib/utils-ui"
import { FUNCTIONS_ROUTES } from "@lib/routes"

interface IDownloadSection {
  storeInterface: storeType
  savedInServiceWorker: Resource<ISavedInServiceWorkerStatus>
  user: string
  repo: string
  downloadSourceUsfmArr: repoIndexObj["downloadLinks"]
  setPrintWholeBook: Setter<boolean>
}
export function DownloadSection(props: IDownloadSection) {
  const [t] = useI18n()
  const [bookOrResource, setBookOrResource] = createSignal()
  const [fileType, setFileType] = createSignal()
  let printWholeUsfmRef: HTMLAnchorElement | undefined
  let bttWriterSinglUsfmForm: HTMLFormElement | undefined

  function buttonIsDisabled() {
    const singleUsfmFileNotSupported =
      bookOrResource() === "BOOK" &&
      fileType() === ".USFM" &&
      !props.downloadSourceUsfmArr.length
    const retVal = {
      enabled: singleUsfmFileNotSupported,
      text: singleUsfmFileNotSupported
        ? t("notYetSupported", {}, "That combination is not yet supported")
        : t("download", {}, "Download")
    }
    return retVal
  }
  function handleDownloadSubmission() {
    const bookOrRes = bookOrResource()
    const type = fileType()

    async function downloadSinglePdf() {
      const storeBook = props.storeInterface.currentBookObj()
      const bookSlug = storeBook?.slug
      if (!bookSlug) return
      const book = await getWholeBook({
        user: props.user,
        repo: props.repo,
        bookSlug,
        savedResponse: props.savedInServiceWorker()?.wholeResponse,
        storeBook
      })
      if (!book) return
      const text = book.chapters.map((chap) => chap.content).join("")
      if (!text) return
      props.storeInterface.mutateStore("printHtml", text)

      props.setPrintWholeBook(true)
      window.print() //not a true pdf, but more helpful than any js lib will be since you can save to pdf
      props.setPrintWholeBook(false)
      // await printPdf(text)
    }
    async function downloadWholePdf() {
      const bibArr = props.storeInterface.getStoreVal("text") as bibleEntryObj[]
      const completeTextIndex = await getWholeResource({
        user: props.user,
        repo: props.repo,
        bibArr: bibArr
      })
      if (!completeTextIndex)
        return console.error("could not get whole resource")
      props.storeInterface.mutateStore("text", completeTextIndex)
      const allHtml = props.storeInterface.wholeResourceHtml()
      if (!allHtml) return
      props.storeInterface.mutateStore("printHtml", allHtml)
      props.setPrintWholeBook(true)
      window.print()
      props.setPrintWholeBook(false)
    }

    function downloadSingleUsfm() {
      if (props.downloadSourceUsfmArr.length) {
        bttWriterSinglUsfmForm && bttWriterSinglUsfmForm.submit()
      }
    }
    function downloadWholeUsfm() {
      printWholeUsfmRef && printWholeUsfmRef.click()
    }

    switch (type) {
      case ".PDF":
        bookOrRes == "BOOK" ? downloadSinglePdf() : downloadWholePdf()
        break
      case ".USFM":
        bookOrRes == "BOOK" ? downloadSingleUsfm() : downloadWholeUsfm()
        break
      default:
        break
    }
  }
  return (
    <div data-title="downloadSection" class="">
      <SectionHeader component="h2" text={t("download", {}, "Download")} />
      <RadioGroup.Root
        data-title="bookOrResourceRadio"
        onChange={(val) => setBookOrResource(val.toUpperCase())}
      >
        <RadioGroup.Label data-title="radio-group__label" class="text-gray-400">
          {t("fileSize", {}, "File Size")}
        </RadioGroup.Label>
        <div
          data-title="radio-group__items"
          class="flex divide-x divide-accent rounded-lg border border-accent"
        >
          <For each={[t("book", {}, "Book"), t("resource", {}, "Resource")]}>
            {(choice) => (
              <RadioGroup.Item
                value={choice}
                data-title="radio"
                class="flex-grow py-2 text-center data-[checked]:bg-accent/10 data-[checked]:text-accent/90"
              >
                <RadioGroup.ItemInput data-title="radio__input" class="" />
                <RadioGroup.ItemControl data-title="radio__control" class="">
                  <RadioGroup.ItemIndicator
                    data-title="radio__indicator"
                    class=""
                  />
                </RadioGroup.ItemControl>
                <RadioGroup.ItemLabel data-title="radio__label" class="">
                  {choice}
                </RadioGroup.ItemLabel>
              </RadioGroup.Item>
            )}
          </For>
        </div>
      </RadioGroup.Root>

      <RadioGroup.Root
        data-title="fileFormatRadio"
        class="mt-4"
        onChange={(val) => setFileType(val.toUpperCase())}
      >
        <RadioGroup.Label data-title="radio-group__label" class="text-gray-400">
          {t("fileType", {}, "File Type")}
        </RadioGroup.Label>
        <div data-title="radio-group__items" class="flex flex-col">
          <For each={[".pdf", ".usfm"]}>
            {(choice) => (
              <div>
                <RadioGroup.Item
                  value={choice}
                  data-title="radio"
                  class="flex items-center justify-between rounded-lg px-4 py-3 data-[checked]:bg-accent/10 data-[checked]:text-accent/90"
                >
                  <RadioGroup.ItemLabel data-title="radio__label" class="">
                    {choice}
                  </RadioGroup.ItemLabel>

                  <RadioGroup.ItemControl
                    data-title="radio__control"
                    class="!data-[checked]:border-accent flex h-4 w-4 items-center justify-center rounded-full border border-slate-700"
                  >
                    <RadioGroup.ItemIndicator
                      data-title="radio__indicator"
                      class="h-2 w-2 rounded-full bg-accent"
                    />
                    <RadioGroup.ItemInput data-title="radio__input" class="" />
                  </RadioGroup.ItemControl>
                </RadioGroup.Item>
              </div>
            )}
          </For>
        </div>
      </RadioGroup.Root>
      <Button.Root
        onClick={handleDownloadSubmission}
        class="mt-4  flex w-full items-center justify-center gap-4 rounded-2xl border border-gray-200 py-3 text-center disabled:border-red-200 disabled:opacity-70"
        disabled={buttonIsDisabled().enabled}
      >
        {buttonIsDisabled().text}
      </Button.Root>

      <div data-role="hiddenControls" class="hidden h-0 w-0">
        <a
          ref={printWholeUsfmRef}
          class="sentenceCase inline-block hover:text-accent focus:text-accent"
          href={`https://content.bibletranslationtools.org/${props.user}/${props.repo}/archive/master.zip`}
        />
        <form
          ref={bttWriterSinglUsfmForm}
          action={FUNCTIONS_ROUTES.downloadUsfmSrc({
            user: props.user,
            repo: props.repo,
            book: props.storeInterface.currentBookObj()?.slug
          })}
          method="post"
        />
      </div>
    </div>
  )
}
