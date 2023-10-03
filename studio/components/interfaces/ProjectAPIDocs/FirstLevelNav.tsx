import { useAppStateSnapshot } from 'state/app-state'
import { DOCS_CONTENT, DOCS_MENU } from './ProjectAPIDocs.constants'
import { Fragment, useEffect } from 'react'
import Link from 'next/link'
import { Button, IconBook, IconBookOpen } from 'ui'
import { useStore } from 'hooks'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { useParams } from 'common'
import { navigateToSection } from './Content/Content.utils'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'

const FirstLevelNav = () => {
  const { ref } = useParams()
  const { meta, ui } = useStore()
  const snap = useAppStateSnapshot()

  const { data } = meta.openApi
  const tables = data?.tables ?? []
  const functions = data?.functions ?? []

  const { data: buckets } = useBucketsQuery({ projectRef: ref })
  const { data: edgeFunctions } = useEdgeFunctionsQuery({ projectRef: ref })

  useEffect(() => {
    if (ui.selectedProjectRef) {
      meta.openApi.load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.selectedProjectRef])

  return (
    <>
      <div className="px-2 py-4  border-b">
        {DOCS_MENU.map((item) => {
          const isActive = snap.activeDocsSection[0] === item.key
          const sections = Object.values(DOCS_CONTENT).filter(
            (snippet) => snippet.category === item.key
          )

          // [Joshen] Need to find the right UI component for accessbility
          return (
            <Fragment key={item.key}>
              <div
                className={`cursor-pointer text-sm py-2 px-3 rounded-md transition ${
                  isActive ? 'bg-surface-300' : ''
                }`}
                onClick={() => snap.setActiveDocsSection([item.key])}
              >
                {item.name}
              </div>
              {isActive && sections.length > 0 && (
                <div className="space-y-2 py-2">
                  {sections.map((section) => (
                    <p
                      key={section.key}
                      title={section.title}
                      className="text-sm text-light px-4 hover:text-foreground transition cursor-pointer"
                      onClick={() => {
                        snap.setActiveDocsSection([item.key])
                        navigateToSection(section.key)
                      }}
                    >
                      {section.title}
                    </p>
                  ))}
                  {item.key === 'entities' &&
                    tables.map((table) => (
                      <p
                        key={table.name}
                        title={table.name}
                        className="text-sm text-light px-4 hover:text-foreground transition cursor-pointer"
                        onClick={() => snap.setActiveDocsSection([item.key, table.name])}
                      >
                        {table.name}
                      </p>
                    ))}
                  {item.key === 'stored-procedures' &&
                    functions.map((fn) => (
                      <p
                        key={fn.name}
                        title={fn.name}
                        className="text-sm text-light px-4 hover:text-foreground transition cursor-pointer"
                        onClick={() => snap.setActiveDocsSection([item.key, fn.name])}
                      >
                        {fn.name}
                      </p>
                    ))}
                  {item.key === 'storage' &&
                    (buckets ?? []).map((bucket) => (
                      <p
                        key={bucket.name}
                        title={bucket.name}
                        className="text-sm text-light px-4 hover:text-foreground transition cursor-pointer"
                        onClick={() => snap.setActiveDocsSection([item.key, bucket.name])}
                      >
                        {bucket.name}
                      </p>
                    ))}
                  {item.key === 'edge-functions' &&
                    (edgeFunctions ?? []).map((fn) => (
                      <p
                        key={fn.name}
                        title={fn.name}
                        className="text-sm text-light px-4 hover:text-foreground transition cursor-pointer"
                        onClick={() => snap.setActiveDocsSection([item.key, fn.name])}
                      >
                        {fn.name}
                      </p>
                    ))}
                </div>
              )}
            </Fragment>
          )
        })}
      </div>
      <div className="px-2 py-4">
        <Link passHref href="https://supabase.com/docs">
          <Button block asChild type="text" size="small" icon={<IconBook />}>
            <a target="_blank" rel="noreferrer" className="!justify-start">
              Documentation
            </a>
          </Button>
        </Link>
        <Link passHref href="https://supabase.com/docs/guides/api">
          <Button block asChild type="text" size="small" icon={<IconBookOpen />}>
            <a target="_blank" rel="noreferrer" className="!justify-start">
              API Reference
            </a>
          </Button>
        </Link>
      </div>
    </>
  )
}

export default FirstLevelNav
