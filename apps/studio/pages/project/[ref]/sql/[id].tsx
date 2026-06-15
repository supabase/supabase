import { usePrevious } from '@uidotdev/usehooks'
import { useParams } from 'common/hooks/useParams'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

import {
  createDraftSqlTab,
  restoreDraftSqlTab,
} from '@/components/interfaces/SQLEditor/createDraftSqlTab'
import { readPersistedDraftSqlTab } from '@/components/interfaces/SQLEditor/draftSqlTabStorage.utils'
import { SQLEditor } from '@/components/interfaces/SQLEditor/SQLEditor'
import { generateSnippetTitle } from '@/components/interfaces/SQLEditor/SQLEditor.constants'
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
import { SnippetWithContent, useSnippets, useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'
import type { NextPageWithLayout } from '@/types'

const SqlEditor: NextPageWithLayout = () => {
  const router = useRouter()
  const { id, ref, content, skip } = useParams()
  const previousRoute = usePrevious(id)
  const { data: project } = useSelectedProjectQuery()
  const { profile } = useProfile()

  const editor = useEditorType()
  const tabs = useTabsStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const { history, setLastVisitedSnippet } = useDashboardHistory()

  const allSnippets = useSnippets(ref!)
  const snippet = allSnippets.find((x) => x.id === id)

  const tabId = !!id ? tabs.openTabs.find((x) => x.endsWith(id)) : undefined

  // A draft is an unsaved snippet that only lives in local storage until the user explicitly saves it
  const persistedDraft =
    !!ref && !!id && id !== 'new' ? readPersistedDraftSqlTab(ref, id) : undefined
  const isDraftId = !!persistedDraft || !!(snippet as SnippetWithContent | undefined)?.isDraftTab

  const hasCreatedDraftRef = useRef(false)

  // [Joshen] May need to investigate separately, but occasionally addSnippet doesnt exist in
  // the snapV2 valtio store for some reason hence why the added typeof check here
  // Drafts are never fetched from the backend since they don't exist there yet.
  const canFetchContentBasedOnId = Boolean(
    id !== 'new' &&
    !isDraftId &&
    typeof snapV2.addSnippet === 'function' &&
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
        router.replace(`/project/${ref}/sql/new`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, data, project])

  // When landing on /new, either redirect to the last visited snippet or open a fresh untitled draft
  // tab (persisted only to local storage until the user explicitly saves it).
  useEffect(() => {
    // Reset the guard whenever we navigate away from /new so the next visit creates a fresh draft.
    // The page component stays mounted across /sql/[id] route changes, so a sticky ref would otherwise
    // prevent creating a second draft.
    if (id !== 'new') {
      hasCreatedDraftRef.current = false
      return
    }
    if (!router.isReady || !ref || !project || !profile) return
    if (hasCreatedDraftRef.current) return

    // [Joshen] Skip flag implies to skip loading the last visited snippet
    if (skip !== 'true' && content === undefined && history.sql !== undefined) {
      const lastSnippet = allSnippets.find((s) => s.id === history.sql)
      if (lastSnippet !== undefined) {
        hasCreatedDraftRef.current = true
        router.replace(`/project/${ref}/sql/${history.sql}`)
        return
      }
    }

    hasCreatedDraftRef.current = true
    const draftId = createDraftSqlTab({
      projectRef: ref,
      projectId: project.id,
      ownerId: profile.id,
      snapV2,
      tabs,
      initialSql: typeof content === 'string' ? content : '',
      skipNavigation: true,
    })
    router.replace(`/project/${ref}/sql/${draftId}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router.isReady, ref, project, profile, skip, content, allSnippets, history.sql])

  // Restore a draft opened directly by URL (e.g. on refresh) from local storage into the editor state
  useEffect(() => {
    if (!ref || !id || id === 'new' || !project || !profile) return
    if (!persistedDraft || snippet) return

    restoreDraftSqlTab({
      draftId: id,
      projectRef: ref,
      projectId: project.id,
      ownerId: profile.id,
      snapV2,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, id, project, profile, persistedDraft, snippet])

  // Watch for route changes
  useEffect(() => {
    if (!router.isReady || !id || id === 'new') return

    const tabId = createTabId('sql', { id })
    const snippet = allSnippets.find((x) => x.id === id)

    tabs.addTab({
      id: tabId,
      type: 'sql',
      label: snippet?.name || persistedDraft?.name || generateSnippetTitle(),
      metadata: {
        sqlId: id,
        name: snippet?.name ?? persistedDraft?.name,
        isDraft: isDraftId,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, id])

  if ((snippetMissing || invalidId) && !snippetMissingImmediatelyAfterCreating) {
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
    <EditorBaseLayout productMenu={<SQLEditorMenu />} product="SQL Editor">
      <SQLEditorLayout>{page}</SQLEditorLayout>
    </EditorBaseLayout>
  </DefaultLayout>
)

export default SqlEditor
