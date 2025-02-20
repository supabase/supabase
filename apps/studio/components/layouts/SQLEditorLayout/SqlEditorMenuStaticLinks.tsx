import { useParams } from 'common'
import { useRouter } from 'next/router'
import { InnerSideMenuDataItem } from 'ui-patterns/InnerSideMenu'

const OPTIONS = ['templates', 'quickstarts'] as const

export function SqlEditorMenuStaticLinks() {
  const { ref } = useParams()
  const router = useRouter()

  function isPageActive(key: string): boolean {
    return router.asPath === `/project/${ref}/sql/${key}`
  }

  return (
    <div>
      {OPTIONS.map((pageId) => {
        const active = isPageActive(pageId)
        return (
          <InnerSideMenuDataItem
            key={pageId}
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
