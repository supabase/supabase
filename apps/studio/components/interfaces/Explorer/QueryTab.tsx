import { useParams } from 'common'
import { Loader2, SquareCode } from 'lucide-react'
import { useRouter } from 'next/router'
import { useContext, useEffect, useState } from 'react'
import { Button } from 'ui'

import { QueryEditor, type ExplorerQueryModel } from './QueryEditor'
import { type QueryResult } from './types'
import { toQuerySourceBinding } from '@/data/query-sources/query-source-registry'
import { explorerQueryState, useExplorerQueryStateSnapshot } from '@/state/explorer-query'
import { useLocalRoleImpersonationState } from '@/state/role-impersonation-state'
import { createTabId, TabsStateContext } from '@/state/tabs'

/** Query-tab lifecycle adapter around the shared QueryEditor. */
export const QueryTab = () => {
  const { id, ref } = useParams()
  const router = useRouter()
  const tabs = useContext(TabsStateContext)
  const querySnap = useExplorerQueryStateSnapshot()
  const roleImpersonationState = useLocalRoleImpersonationState()

  const [restoredQueryKey, setRestoredQueryKey] = useState<string>()

  const stateDraft = id ? querySnap.drafts[id] : undefined
  const draft = stateDraft?.projectRef === ref ? stateDraft : undefined
  const result = draft && id ? querySnap.results[id] : undefined
  const queryKey = id && ref ? `${ref}:${id}` : undefined

  useEffect(() => {
    if (!id || !ref) return

    const restored = explorerQueryState.restoreDraft({ id, projectRef: ref })
    const restoredDraft = explorerQueryState.drafts[id]
    if (restored && restoredDraft) {
      tabs.addTab({
        id: createTabId('query', { id }),
        type: 'query',
        label: restoredDraft.name,
        metadata: { queryId: id },
        isPreview: false,
      })
    }
    setRestoredQueryKey(`${ref}:${id}`)
  }, [id, ref, tabs])

  if (!queryKey || restoredQueryKey !== queryKey) {
    return (
      <div
        role="status"
        aria-label="Loading query"
        className="flex h-full items-center justify-center bg-surface-100"
      >
        <Loader2 className="animate-spin text-foreground-muted" size={18} />
      </div>
    )
  }

  if (!id || !draft) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-surface-100">
        <SquareCode className="text-foreground-muted" size={24} />
        <div className="text-center">
          <p className="text-sm font-medium">Query draft not found</p>
          <p className="text-sm text-foreground-lighter">
            This local draft may have been closed or cleared from this browser.
          </p>
        </div>
        <Button onClick={() => router.push(`/project/${ref}/explorer`)}>Back to Explorer</Button>
      </div>
    )
  }

  const handleResultChange = (nextResult: QueryResult) => {
    explorerQueryState.setResult({
      id,
      result: { ...nextResult, executedAt: Date.now() },
    })
  }

  const query: ExplorerQueryModel =
    draft._tag === 'logs'
      ? { ...toQuerySourceBinding(draft), uncheckedSql: draft.uncheckedSql }
      : {
          ...toQuerySourceBinding(draft),
          uncheckedSql: draft.uncheckedSql,
          rowLimit: draft.rowLimit,
        }

  return (
    <QueryEditor
      id={id}
      variant="viewport"
      title={draft.name}
      query={query}
      result={result}
      roleImpersonationState={roleImpersonationState}
      onTitleChange={(value) => {
        const name = value.trim() || 'Untitled query'
        explorerQueryState.updateDraft({ id, name })
        tabs.updateTab(createTabId('query', { id }), { label: name })
      }}
      onSqlChange={(sql) => explorerQueryState.updateDraft({ id, sql })}
      onSourceChange={(source) => explorerQueryState.updateDraft({ id, source })}
      onResultChange={handleResultChange}
      onRowLimitChange={(rowLimit) => explorerQueryState.updateDraft({ id, rowLimit })}
    />
  )
}
