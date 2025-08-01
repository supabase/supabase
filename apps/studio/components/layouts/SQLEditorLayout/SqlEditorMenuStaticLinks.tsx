import { useParams } from 'common'
import { useRouter } from 'next/router'
import { InnerSideMenuDataItem } from 'ui-patterns/InnerSideMenu'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import {
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuCollapsibleTrigger,
  InnerSideMenuSeparator,
} from 'ui-patterns'

const OPTIONS = ['templates', 'quickstarts'] as const

export function SqlEditorMenuStaticLinks() {
  const { ref } = useParams()
  const router = useRouter()

  const [communitySectionOpen, setCommunitySectionOpen] = useLocalStorage<boolean>(
    `sql-editor-community-section-state-${ref ?? ''}`,
    true
  )

  function isPageActive(key: string): boolean {
    return router.asPath === `/project/${ref}/sql/${key}`
  }

  return (
    <>
      <InnerSideMenuCollapsible
        className="px-0"
        open={communitySectionOpen}
        onOpenChange={(value) => {
          setCommunitySectionOpen(value)
        }}
      >
        <InnerSideMenuCollapsibleTrigger title="Community" />
        <InnerSideMenuCollapsibleContent className="group-data-[state=open]:pt-2">
          {OPTIONS.map((pageId) => {
            const active = isPageActive(pageId)
            return (
              <InnerSideMenuDataItem
                key={pageId}
                title={pageId === 'templates' ? 'Templates' : 'Quickstarts'}
                isActive={active}
                isOpened={false}
                href={`/project/${ref}/sql/${pageId}`}
                className="capitalize"
              >
                {pageId}
              </InnerSideMenuDataItem>
            )
          })}
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>
      <InnerSideMenuSeparator />
    </>
  )
}
