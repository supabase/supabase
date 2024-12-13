import { useFeaturePreviewContext } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useParams, usePathname } from 'next/navigation'
import { getTabsStore, makeActiveTabPermanent } from 'state/tabs'
import { InnerSideMenuDataItem } from 'ui-patterns/InnerSideMenu'
import { useSnapshot } from 'valtio'

const OPTIONS = ['templates', 'quickstarts'] as const

export function SqlEditorMenuStaticLinks() {
  const pathname = usePathname()
  const { flags } = useFeaturePreviewContext()
  const isSqlEditorTabsEnabled = flags[LOCAL_STORAGE_KEYS.UI_SQL_EDITOR_TABS]
  const { ref } = useParams<{ ref: string }>()
  const tabStore = getTabsStore(ref)
  const tabs = useSnapshot(tabStore)

  function isPageActive(key: string): boolean {
    return pathname === `/project/${ref}/sql/${key}`
  }

  return (
    <div>
      {OPTIONS.map((pageId) => {
        const isPreview = isSqlEditorTabsEnabled ? tabs.previewTabId === `sql-${pageId}` : false
        const isOpen = tabs.openTabs.includes(`sql-${pageId}`)
        const isActive = !isSqlEditorTabsEnabled
          ? isPageActive(pageId)
          : Object.values(tabs.tabsMap).some((tab) => tab?.id === `sql-${pageId}`)
        return (
          <InnerSideMenuDataItem
            title="Templates"
            isActive={isActive}
            isOpened={isOpen}
            isPreview={isPreview}
            href={`/project/${ref}/sql/${pageId}`}
            onDoubleClick={() => {
              makeActiveTabPermanent(ref)
            }}
            className="capitalize"
          >
            {pageId}
          </InnerSideMenuDataItem>
        )
      })}
    </div>
  )
}
