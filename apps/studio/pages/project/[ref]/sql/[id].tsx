import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useParams } from 'common/hooks/useParams'
import { SQLEditor } from 'components/interfaces/SQLEditor/SQLEditor'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { EditorBaseLayout } from 'components/layouts/editors/EditorBaseLayout'
import { useEditorType } from 'components/layouts/editors/EditorsLayout.hooks'
import SQLEditorLayout from 'components/layouts/SQLEditorLayout/SQLEditorLayout'
import { SQLEditorMenu } from 'components/layouts/SQLEditorLayout/SQLEditorMenu'
import { useContentIdQuery } from 'data/content/content-id-query'
import { useDashboardHistory } from 'hooks/misc/useDashboardHistory'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM } from 'lib/constants'
import { SnippetWithContent, useSnippets, useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { createTabId, useTabsStateSnapshot } from 'state/tabs'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

const SqlEditor: NextPageWithLayout = () => {
  const router = useRouter()
  const { id, ref, content, skip } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const editor = useEditorType()
  const tabs = useTabsStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const { history, setLastVisitedSnippet } = useDashboardHistory()

  const allSnippets = useSnippets(ref!)
  const snippet = allSnippets.find((x) => x.id === id)

  const tabId = !!id ? tabs.openTabs.find((x) => x.endsWith(id)) : undefined

  // [Refactor] There's an unnecessary request getting triggered when we start typing while on /new
  // the URL ID gets updated and we attempt to fetch content for a snippet that's not been created yet
  // [Joshen] May need to investigate separately, but occasionally addSnippet doesnt exist in
  // the snapV2 valtio store for some reason hence why the added typeof check here
  const canFetchContentBasedOnId = Boolean(
    id !== 'new' && typeof snapV2.addSnippet === 'function' && !snippet?.isNotSavedInDatabaseYet
  )
  const { data, error, isError } = useContentIdQuery(
    { projectRef: ref, id },
    {
      retry: false,
      enabled: canFetchContentBasedOnId,
    }
  )

  const snippetMissing =
    isError && error.code === 404 && error.message.includes('Content not found')
  const invalidId = isError && error.code === 400 && error.message.includes('Invalid uuid')

  useEffect(() => {
    if (ref && data && project) {
      // [Joshen] Check if snippet belongs to the current project
      if (!IS_PLATFORM || data.project_id === project.id) {
        snapV2.setSnippet(ref, data as unknown as SnippetWithContent)
      } else {
        setLastVisitedSnippet(undefined)
        router.push(`/project/${ref}/sql/new`)
      }
    }
  }, [ref, data, project])

  // Load the last visited snippet when landing on /new
  useEffect(() => {
    if (
      id === 'new' &&
      skip !== 'true' && // [Joshen] Skip flag implies to skip loading the last visited snippet
      history.sql !== undefined &&
      content === undefined
    ) {
      const snippet = allSnippets.find((snippet) => snippet.id === history.sql)
      if (snippet !== undefined) router.push(`/project/${ref}/sql/${history.sql}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, allSnippets, content])

  // Watch for route changes
  useEffect(() => {
    if (!router.isReady || !id || id === 'new') return

    const tabId = createTabId('sql', { id })
    const snippet = allSnippets.find((x) => x.id === id)

    tabs.addTab({
      id: tabId,
      type: 'sql',
      label: snippet?.name || 'Untitled Query',
      metadata: {
        sqlId: id,
        name: snippet?.name,
      },
    })
  }, [router.isReady, id])

  if (snippetMissing || invalidId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-[400px]">
          <Admonition
            type="default"
            title={`Unable to find snippet with ID ${id}`}
            description="This snippet doesn't exist in your project"
          >
            {!!tabId ? (
              <Button
                type="default"
                className="mt-2"
                onClick={() => {
                  tabs.handleTabClose({
                    id: tabId,
                    router,
                    editor,
                    onClearDashboardHistory: () => setLastVisitedSnippet(undefined),
                  })
                }}
              >
                Close tab
              </Button>
            ) : (
              <Button asChild type="default" className="mt-2">
                <Link href={`/project/${ref}/sql`}>Head back</Link>
              </Button>
            )}
          </Admonition>
        </div>
      </div>
    )
  }

  return <SQLEditor />
}

SqlEditor.getLayout = (page) => (
  <DefaultLayout>
    <EditorBaseLayout productMenu={<SQLEditorMenu />} product="SQL Editor">
      <SQLEditorLayout>{page}</SQLEditorLayout>
    </EditorBaseLayout>
  </DefaultLayout>
)

export default SqlEditor
