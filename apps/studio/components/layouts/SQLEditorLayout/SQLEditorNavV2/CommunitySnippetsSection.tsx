import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { BookText } from 'lucide-react'
import { useRouter } from 'next/router'
import {
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuCollapsibleTrigger,
} from 'ui-patterns'
import { InnerSideMenuDataItem } from 'ui-patterns/InnerSideMenu'
import { DEFAULT_SECTION_STATE, type SectionState } from './SQLEditorNav.constants'

const OPTIONS = ['templates', 'quickstarts'] as const

export function CommunitySnippetsSection() {
  const { ref } = useParams()
  const router = useRouter()

  const [sectionVisibility, setSectionVisibility] = useLocalStorage<SectionState>(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_SECTION_STATE(ref ?? ''),
    DEFAULT_SECTION_STATE
  )
  const { community: showCommunitySnippets } = sectionVisibility

  function isPageActive(key: string): boolean {
    return router.asPath === `/project/${ref}/sql/${key}`
  }

  return (
    <InnerSideMenuCollapsible
      className="px-0"
      open={showCommunitySnippets}
      onOpenChange={(value) => {
        setSectionVisibility({
          ...(sectionVisibility ?? DEFAULT_SECTION_STATE),
          community: value,
        })
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
              <BookText size={16} className="text-foreground-muted" />
              {pageId}
            </InnerSideMenuDataItem>
          )
        })}
      </InnerSideMenuCollapsibleContent>
    </InnerSideMenuCollapsible>
  )
}
