import { useParams, usePathname } from 'next/navigation'
import { InnerSideMenuDataItem } from 'ui-patterns/InnerSideMenu'

const OPTIONS = ['templates', 'quickstarts'] as const

export function SqlEditorMenuStaticLinks() {
  const pathname = usePathname()

  const { ref } = useParams<{ ref: string }>()

  function isPageActive(key: string): boolean {
    return pathname === `/project/${ref}/sql/${key}`
  }

  return (
    <div>
      {OPTIONS.map((pageId) => {
        const active = isPageActive(pageId)
        return (
          <InnerSideMenuDataItem
            title="Templates"
            isActive={active}
            isOpened={false}
            href={`/project/${ref}/sql/${pageId}`}
            className="capitalize"
          >
            {pageId}
          </InnerSideMenuDataItem>
        )
      })}
    </div>
  )
}
