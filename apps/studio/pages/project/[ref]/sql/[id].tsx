import { usePrevious } from '@uidotdev/usehooks'
import { useParams } from 'common/hooks/useParams'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

import {
  createDraftSqlTab,
  isDraftSqlSnippet,
  restoreDraftSqlTab,
} from '@/components/interfaces/SQLEditor/createDraftSqlTab'
import { SQLEditor } from '@/components/interfaces/SQLEditor/SQLEditor'
import { generateSnippetTitle } from '@/components/interfaces/SQLEditor/SQLEditor.constants'
import { getSnippetQuerySource } from '@/components/interfaces/SQLEditor/sqlSnippet.utils'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import { EditorBaseLayout } from '@/components/layouts/editors/EditorBaseLayout'
import { useEditorType } from '@/components/layouts/editors/EditorsLayout.hooks'
import SQLEditorLayout from '@/components/layouts/SQLEditorLayout/SQLEditorLayout'
import { SQLEditorMenu } from '@/components/layouts/SQLEditorLayout/SQLEditorMenu'
import { useContentIdQuery } from '@/data/content/content-id-query'
import { useDashboardHistory } from '@/hooks/misc/useDashboardHistory'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'
import { useProfile } from '@/lib/profile'
import { useQueryExecutionSourceSnapshot } from '@/state/query-execution-source'
import { SnippetWithContent, useSnippets, useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'
import type { NextPageWithLayout } from '@/types'

const SqlEditor: NextPageWithLayout = () => {
  const router = useRouter()
  const { id, ref, content, source } = useParams()
  const previousRoute = usePrevious(id)
  const { data: project } = useSelectedProjectQuery()
  const { profile } = useProfile()
  const creatingDraftRef = useRef(false)

  const editor = useEditorType()
  const tabs = useTabsStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const querySourceState = useQueryExecutionSourceSnapshot()
  const { setLastVisitedSnippet } = useDashboardHistory()

  const allSnippets = useSnippets(ref!)
  const snippet = allSnippets.find((x) => x.id === id)
  const tabId = id ? tabs.openTabs.find((x) => x.endsWith(id)) : undefined
  const tab = tabId ? tabs.tabsMap[tabId] : undefined
  const isDraftTab = isDraftSqlSnippet(snippet) || tab?.metadata?.isDraft === true

  const canFetchContentBasedOnId = Boolean(
    id &&
    id !== 'new' &&
    typeof snapV2.addSnippet === 'function' &&
    !isDraftTab &&
    !snippet?.isNotSavedInDatabaseYet
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

  const snippetMissingImmediatelyAfterCreating =
    !!snippet && snippetMissing && previousRoute === 'new' && 'isNotSavedInDatabaseYet' in snippet

  useEffect(() => {
    if (
      id !== 'new' ||
      !router.isReady ||
      !ref ||
      !project ||
      !profile ||
      creatingDraftRef.current
    ) {
      return
    }

    creatingDraftRef.current = true

    const initialSql = typeof content === 'string' ? content : ''
    const querySource = source === 'logs' ? ('logs' as const) : ('database' as const)

    const draftId = createDraftSqlTab({
      projectRef: ref,
      projectId: project.id,
      ownerId: profile.id,
      snapV2,
      tabs,
      initialSql,
      querySource,
      skipNavigation: true,
    })

    if (source === 'logs') {
      querySourceState.setExecutionSource('logs')
    }

    void router.replace(`/project/${ref}/sql/${draftId}`)
  }, [content, id, profile, project, querySourceState, ref, router, snapV2, source, tabs])

  useEffect(() => {
    if (!router.isReady || !id || id === 'new' || !ref || !project || !profile) return
    if (!tab?.metadata?.isDraft || snippet) return

    restoreDraftSqlTab({
      draftId: id,
      projectRef: ref,
      projectId: project.id,
      ownerId: profile.id,
      snapV2,
      name: tab.metadata?.name ?? generateSnippetTitle(),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, id, ref, project, profile, tab?.metadata?.isDraft, snippet])

  useEffect(() => {
    if (ref && data && project) {
      if (!IS_PLATFORM || data.project_id === project.id) {
        snapV2.setSnippet(ref, data as unknown as SnippetWithContent)
        setLastVisitedSnippet(data.id)
      } else {
        setLastVisitedSnippet(undefined)
        void router.replace(`/project/${ref}/sql/new?skip=true`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, data, project])

  useEffect(() => {
    if (router.query.source === 'logs') {
      querySourceState.setExecutionSource('logs')
    } else if (data) {
      querySourceState.setExecutionSource(getSnippetQuerySource(data))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.source, data])

  useEffect(() => {
    if (!router.isReady || !id || id === 'new') return

    const nextTabId = createTabId('sql', { id })
    const routeSnippet = allSnippets.find((x) => x.id === id)

    tabs.addTab({
      id: nextTabId,
      type: 'sql',
      label: routeSnippet?.name || tab?.metadata?.name || generateSnippetTitle(),
      metadata: {
        sqlId: id,
        name: routeSnippet?.name ?? tab?.metadata?.name,
        isDraft: isDraftTab,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, id])

  useEffect(() => {
    if (!router.isReady || !ref || !id || id === 'new') return

    if (snippetMissing && !snippetMissingImmediatelyAfterCreating && !isDraftTab) {
      setLastVisitedSnippet(undefined)
      const staleTabId = createTabId('sql', { id })
      if (tabs.openTabs.includes(staleTabId)) {
        tabs.removeTab(staleTabId)
      }
      void router.replace(`/project/${ref}/sql/new?skip=true`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, ref, id, snippetMissing, snippetMissingImmediatelyAfterCreating, isDraftTab])

  if (id === 'new') {
    return null
  }

  if (snippetMissing && !snippetMissingImmediatelyAfterCreating && !isDraftTab) {
    return null
  }

  if (invalidId) {
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
              <Button
                asChild
                type="default"
                className="mt-2"
                onClick={() => setLastVisitedSnippet(undefined)}
              >
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
    <EditorBaseLayout productMenu={<SQLEditorMenu />}>
      <SQLEditorLayout>{page}</SQLEditorLayout>
    </EditorBaseLayout>
  </DefaultLayout>
)

export default SqlEditor
