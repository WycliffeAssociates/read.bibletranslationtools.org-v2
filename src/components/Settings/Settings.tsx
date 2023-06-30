import type { Setter, Accessor, Resource } from "solid-js"
import { useI18n } from "@solid-primitives/i18n"
import type { storeType } from "../ReaderWrapper/ReaderWrapper"
import type {
  ISavedInServiceWorkerStatus,
  repoIndexObj
} from "@customTypes/types"
import { Dialog } from "@kobalte/core"
import {
  IconClose,
  IconDocument,
  IconBookMark,
  IconWeb,
  IconClock
} from "@components/Icons/Icons"
import { DetailItem, SectionHeader } from "./index"
import { intlDate } from "@lib/utils"
import { OfflineSection } from "./OfflineSection"
import { DownloadSection } from "./DownloadSection"
import { getPortalSpot } from "@lib/utils-ui"

interface settingsProps {
  settingsAreOpen: Accessor<boolean>
  setSettingsOpen: Setter<boolean>
  topAmount: () => string
  repoIndex: repoIndexObj
  storeInterface: storeType
  savedInServiceWorker: Resource<ISavedInServiceWorkerStatus>
  user: string
  repo: string
  downloadSourceUsfmArr: repoIndexObj["downloadLinks"]
  setPrintWholeBook: Setter<boolean>
  refetchSwResponses: (
    info?: unknown
  ) =>
    | ISavedInServiceWorkerStatus
    | Promise<ISavedInServiceWorkerStatus | undefined>
    | null
    | undefined
}

export default function Settings(props: settingsProps) {
  const [t] = useI18n()
  const resTypeName = () => {
    return (
      props.repoIndex.resourceType?.charAt(0).toLocaleUpperCase() +
      props.repoIndex.resourceType?.slice(1)
    )
  }

  return (
    <Dialog.Root
      open={props.settingsAreOpen()}
      onOpenChange={props.setSettingsOpen}
    >
      <Dialog.Portal mount={getPortalSpot()}>
        <Dialog.Overlay
          data-title="dialog__overlay"
          class="fixed inset-0 z-50 hidden bg-black/20 data-[expanded]:block print:hidden"
        />
        {/* animate-[slideRight_.2s_ease-in-out_forwards] */}
        {/* data-[expanded]:animate-[slideLeft_.2s_ease-in-out_forwards] */}
        <Dialog.Content
          style={{
            top: props.topAmount()
          }}
          data-title="dialog__settings__content"
          class="fixed right-0 top-0  z-[60] max-h-[90vh] max-w-sm transform  animate-[fadeOut.25s_ease-in-out_forwards] overflow-scroll bg-white px-4 pb-10 pt-3 data-[expanded]:animate-[fadeIn.25s_ease-in-out_forwards]  print:hidden"
        >
          <div
            data-title="dialog__header"
            class="relative  mb-8 flex items-center justify-between"
          >
            <Dialog.Title
              data-title="dialog__title"
              class="text-xl font-bold md:text-2xl"
            >
              {t("settings", {}, "settings")}
            </Dialog.Title>
            <Dialog.CloseButton
              data-title="dialog__close-button"
              class="border-gray block rounded-md border border-gray-200  p-3 px-4 text-darkAccent hover:bg-gray-100 focus:outline-2 focus:outline-accent ltr:ml-auto rtl:mr-auto"
            >
              <IconClose />
            </Dialog.CloseButton>
          </div>
          <div data-title="detailsSection">
            {/* <h2 class="mb-4 text-lg font-bold">Details</h2> */}
            <SectionHeader component="h2" text={t("details", {}, "Details")} />
            <ul class="flex flex-col gap-3">
              <DetailItem
                icon={<IconDocument />}
                header={t("resourceType", {}, "Resource Type")}
                detail={resTypeName()}
              />
              <DetailItem
                icon={<IconBookMark />}
                header={t("currentBook", {}, "Current Book")}
                detail={props.storeInterface.currentBookObj()?.label || ""}
              />
              <DetailItem
                icon={<IconWeb />}
                header={t("language", {}, "Language")}
                detail={props.repoIndex.languageName}
              />
              <DetailItem
                icon={<IconClock />}
                header={t("lastModified", {}, "Last Modified")}
                detail={intlDate(
                  props.repoIndex.lastRendered,
                  [...navigator.languages],
                  {
                    dateStyle: "medium"
                  }
                )}
              />
            </ul>
            <span class="my-9 block h-[1px] w-full bg-gray-200" />
          </div>
          <div data-title="offlineSection" class="">
            <OfflineSection
              repoIndex={props.repoIndex}
              savedInServiceWorker={props.savedInServiceWorker}
              storeInterface={props.storeInterface}
              repo={props.repo}
              user={props.user}
              refetchSwResponses={props.refetchSwResponses}
            />
          </div>
          <span class="my-9 block h-[1px] w-full bg-gray-200" />
          <DownloadSection
            storeInterface={props.storeInterface}
            repo={props.repo}
            user={props.user}
            savedInServiceWorker={props.savedInServiceWorker}
            setPrintWholeBook={props.setPrintWholeBook}
            downloadSourceUsfmArr={props.downloadSourceUsfmArr}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
