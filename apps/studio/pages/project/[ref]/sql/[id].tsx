import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { usePrevious } from '@uidotdev/usehooks'
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
import uuidv4 from 'lib/uuid'
import { SnippetWithContent, useSnippets, useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { createTabId, useTabsStateSnapshot } from 'state/tabs'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

const SqlEditor: NextPageWithLayout = () => {
  const router = useRouter()
  const { id, ref, content, skip } = useParams()
  const previousRoute = usePrevious(id)
  const { data: project } = useSelectedProjectQuery()

  const editor = useEditorType()
  const tabs = useTabsStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const { history, setLastVisitedSnippet } = useDashboardHistory()

  const allSnippets = useSnippets(ref!)
  const snippet = allSnippets.find((x) => x.id === id)

  // Also check snapV2 for snippet (it might be loaded there before allSnippets updates)
  const snippetFromStore = snapV2.snippets[id as string]?.snippet

  // Check if a tab exists with this ID (local tab)
  const existingTabId = id ? createTabId('sql', { id }) : undefined
  const existingTab = existingTabId ? tabs.tabsMap[existingTabId] : null

  // [Joshen] May need to investigate separately, but occasionally addSnippet doesnt exist in
  // the snapV2 valtio store for some reason hence why the added typeof check here
  // Only fetch snippet if no local tab exists AND content is not already loaded
  const canFetchContentBasedOnId = Boolean(
    id !== 'new' &&
    !existingTab && // Don't fetch if a local tab already exists
    typeof snapV2.addSnippet === 'function' &&
    !snippet?.isNotSavedInDatabaseYet &&
    !snippetFromStore?.content?.sql // Don't fetch if SQL content is already loaded
  )
  const { data, error, isError, isLoading: isFetchingContent } = useContentIdQuery(
    { projectRef: ref, id },
    {
      retry: false,
      enabled: canFetchContentBasedOnId,
    }
  )

  const snippetMissing =
    isError && error.code === 404 && error.message.includes('Content not found')
  const invalidId = isError && error.code === 400 && error.message.includes('Invalid uuid')

  // [Joshen] Atm we suspect that replication lag is causing this to happen whereby a newly created snippet
  // shows the "Unable to find snippet" error which blocks the whole UI
  // Am opting to silently swallow this error, since the saves are still going through and we're scoping this behaviour
  // behaviour down to a very specific use case too with all these conditionals
  // More details: https://github.com/supabase/supabase/pull/39389
  const snippetMissingImmediatelyAfterCreating =
    !!snippet && snippetMissing && previousRoute === 'new' && 'isNotSavedInDatabaseYet' in snippet

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!router.isReady || !id || !ref) return

    // Handle /new route - create a new tab with generated ID
    if (id === 'new') {
      // Generate a unique ID for this new tab
      const newTabId = uuidv4()
      const tabId = createTabId('sql', { id: newTabId })

      tabs.addTab({
        id: tabId,
        type: 'sql',
        label: 'Untitled Query',
        isPreview: false, // Make it permanent so it doesn't close other tabs
        metadata: {
          sql: '',
          // No snippetId - this is a local-only tab until saved
        },
      })

      // Redirect to the new tab ID so the URL matches the tab
      router.replace(`/project/${ref}/sql/${newTabId}`, undefined, { shallow: true })
      return
    }

    const tabId = createTabId('sql', { id })

    // Step 1: Look for existing tab with this ID
    if (tabs.tabsMap[tabId]) {
      // Tab exists, just activate it
      tabs.makeTabActive(tabId)
      return
    }

    // Step 2: No tab exists, look for snippet with this ID
    // Check both allSnippets and snippetFromStore (snippetFromStore might have content loaded)
    const snippetData = snippetFromStore || allSnippets.find((x) => x.id === id)

    // Only create tab if snippet has SQL content loaded
    // This prevents creating tabs with empty SQL when metadata is loaded but content is not
    if (snippetData && snippetData.content?.sql !== undefined) {
      // Snippet exists with SQL content, create tab with snippet ID as tab ID
      tabs.addTab({
        id: tabId,
        type: 'sql',
        label: snippetData.name || 'Untitled Query',
        isPreview: false, // Make it permanent
        metadata: {
          sqlId: id, // Keep for backward compatibility
          snippetId: id, // Link to snippet
          sql: snippetData.content.sql, // Store SQL in tab
          name: snippetData.name,
        },
      })
      tabs.makeTabActive(tabId) // Activate the newly created tab
    }
    // If snippet exists but SQL not loaded yet, wait for useContentIdQuery to fetch it
    // If neither tab nor snippet exists, will show error

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, id, allSnippets, snippetFromStore])

  // Don't show error if:
  // 1. Currently fetching the snippet content
  // 2. A tab exists with this ID (local tab without snippet)
  const shouldShowError = (snippetMissing || invalidId) &&
    !snippetMissingImmediatelyAfterCreating &&
    !isFetchingContent &&
    !existingTab // Don't show error if a local tab exists

  if (shouldShowError) {
    const errorTabId = existingTabId // Use the existing tab ID we already calculated

    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-[400px]">
          <Admonition
            type="default"
            title={`Unable to find snippet with ID ${id}`}
            description="This snippet doesn't exist in your project"
          >
            {errorTabId && tabs.tabsMap[errorTabId] ? (
              <Button
                type="default"
                className="mt-2"
                onClick={() => {
                  tabs.handleTabClose({
                    id: errorTabId,
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
    <EditorBaseLayout productMenu={<SQLEditorMenu />} product="SQL Editor">
      <SQLEditorLayout>{page}</SQLEditorLayout>
    </EditorBaseLayout>
  </DefaultLayout>
)

export default SqlEditor
