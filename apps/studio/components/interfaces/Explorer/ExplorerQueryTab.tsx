import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { Check, Keyboard, Loader2, MoreVertical, Save, SquareCode } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useContext, useEffect, useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'ui'

import { ExplorerToolbarAction } from './ExplorerToolbar'
import { QueryEditor, type ExplorerQueryModel } from './QueryEditor'
import { type QueryDisplay, type QueryResult } from './types'
import { toQuerySourceBinding } from '@/data/query-sources/query-source-registry'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { explorerQueryState, useExplorerQueryStateSnapshot } from '@/state/explorer-query'
import { useControlledRoleImpersonationState } from '@/state/role-impersonation-state'
import { createTabId, TabsStateContext } from '@/state/tabs'

/** Query-tab lifecycle adapter around the shared QueryEditor. */
export const ExplorerQueryTab = () => {
  const { id, ref } = useParams()
  const router = useRouter()
  const tabs = useContext(TabsStateContext)
  const querySnap = useExplorerQueryStateSnapshot()

  const [isIntellisenseEnabled, setIsIntellisenseEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE,
    true
  )

  const [restoredQueryKey, setRestoredQueryKey] = useState<string>()
  const [showQuery, setShowQuery] = useState(true)

  const stateDraft = id ? querySnap.drafts[id] : undefined
  const draft = stateDraft?.projectRef === ref ? stateDraft : undefined
  const result = draft && id ? querySnap.results[id] : undefined
  const queryKey = id && ref ? `${ref}:${id}` : undefined

  const roleImpersonationState = useControlledRoleImpersonationState(
    draft?._tag === 'database' ? draft.role : undefined,
    useCallback(
      (role) => {
        if (id) explorerQueryState.setRole({ id, role })
      },
      [id]
    )
  )

  useEffect(() => {
    if (!id || !ref) return

    setShowQuery(true)
    explorerQueryState.restoreDraft({ id, projectRef: ref })
    setRestoredQueryKey(`${ref}:${id}`)
  }, [id, ref])

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

  const display: QueryDisplay = {
    view: draft.view,
    chart: draft.chart ? { ...draft.chart, y_series: [...draft.chart.y_series] } : undefined,
  }

  const query: ExplorerQueryModel =
    draft._tag === 'logs'
      ? { ...toQuerySourceBinding(draft), uncheckedSql: draft.uncheckedSql }
      : {
          ...toQuerySourceBinding(draft),
          uncheckedSql: draft.uncheckedSql,
          rowLimit: draft.rowLimit,
        }

  const persistTab = () => tabs.makeTabPermanent(createTabId('query', { id }))

  const handleResultChange = (nextResult: QueryResult) => {
    explorerQueryState.setResult({
      id,
      result: { ...nextResult, executedAt: Date.now() },
    })
  }

  return (
    <QueryEditor
      hideRunLabel
      id={id}
      variant="viewport"
      title={draft.name}
      query={query}
      result={result}
      display={display}
      showQuery={showQuery}
      onShowQueryChange={setShowQuery}
      roleImpersonationState={roleImpersonationState}
      onTitleChange={(value) => {
        persistTab()
        const name = value.trim() || 'Untitled query'
        explorerQueryState.updateDraft({ id, name })
        tabs.updateTab(createTabId('query', { id }), { label: name })
      }}
      onSqlChange={(sql) => {
        persistTab()
        explorerQueryState.updateDraft({ id, sql })
      }}
      onSourceChange={(source) => {
        persistTab()
        explorerQueryState.updateDraft({ id, source })
      }}
      onRowLimitChange={(rowLimit) => {
        persistTab()
        explorerQueryState.updateDraft({ id, rowLimit })
      }}
      onResultChange={handleResultChange}
      onDisplayChange={(display) => {
        persistTab()
        explorerQueryState.setDisplay({ id, display })
      }}
      toolbarActions={
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ExplorerToolbarAction icon={<Save />} tooltip="Save query" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52" align="end">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Add to existing notebook</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>asd</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem>Create a new notebook</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ExplorerToolbarAction icon={<MoreVertical />} />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                className="justify-between"
                onClick={() => setIsIntellisenseEnabled(!isIntellisenseEnabled)}
              >
                <div className="flex items-center gap-x-2">
                  <Keyboard size={14} />
                  <span>Intellisense enabled</span>
                </div>
                {isIntellisenseEnabled && <Check className="text-brand" size={16} />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    />
  )
}
