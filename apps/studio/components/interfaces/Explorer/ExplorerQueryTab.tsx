import { useDebounce } from '@uidotdev/usehooks'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { Check, Keyboard, Loader2, MoreVertical, Save, SquareCode } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { ExplorerToolbarAction } from './ExplorerToolbar'
import { useCreateNotebook } from './hooks'
import { QueryEditor, type ExplorerQueryModel } from './QueryEditor'
import { type QueryDisplay, type QueryResult } from './types'
import { createQueryCellSkeleton } from './utils'
import { getNotebook } from '@/data/content/notebooks/notebook-query'
import { useNotebooksInfiniteQuery } from '@/data/content/notebooks/notebooks-infinite-query'
import { toQuerySourceBinding } from '@/data/query-sources/query-source-registry'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { explorerQueryState, useExplorerQueryStateSnapshot } from '@/state/explorer-query'
import { useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'
import { useControlledRoleImpersonationState } from '@/state/role-impersonation-state'
import { createTabId, TabsStateContext } from '@/state/tabs'

/** Query-tab lifecycle adapter around the shared QueryEditor. */
export const ExplorerQueryTab = () => {
  const router = useRouter()
  const { id, ref } = useParams()
  const tabs = useContext(TabsStateContext)
  const querySnap = useExplorerQueryStateSnapshot()

  const { createNotebook } = useCreateNotebook()
  const notebooksSnap = useNotebooksStateSnapshot()

  const [isIntellisenseEnabled, setIsIntellisenseEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE,
    true
  )

  const [restoredQueryKey, setRestoredQueryKey] = useState<string>()
  const [showQuery, setShowQuery] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const { data: notebooksData, isPending } = useNotebooksInfiniteQuery({
    projectRef: ref,
    limit: 100,
    name: search.length === 0 ? search : debouncedSearch,
  })
  const notebooks = useMemo(() => {
    const items = notebooksData?.pages.flatMap((page) => page.content) ?? []
    return items
  }, [notebooksData?.pages])

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

  const onAddToNewNotebook = () => {
    createNotebook({
      cells: [createQueryCellSkeleton({ title: draft.name, sql: draft.uncheckedSql })],
    })
  }

  const onAddToExistingNotebook = async (notebookId: string) => {
    if (!ref) return
    try {
      if (!notebooksSnap.notebooks[notebookId]?.notebook.content) {
        const notebook = await getNotebook({ projectRef: ref, id: notebookId })
        notebooksSnap.setNotebook({ projectRef: ref, notebook })
      }

      notebooksSnap.insertCellAfter({
        id: notebookId,
        cell: createQueryCellSkeleton({ title: draft.name, sql: draft.uncheckedSql }),
      })
      notebooksSnap.requestScrollToBottom(notebookId)

      router.push(`/project/${ref}/explorer/notebook/${notebookId}`)
    } catch (error) {
      toast.error('Failed to add query to notebook')
    }
  }

  return (
    <QueryEditor
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
              <ExplorerToolbarAction
                icon={<Save size={16} strokeWidth={2} />}
                tooltip="Save query"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52" align="end">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Add to existing notebook</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      autoFocus
                      placeholder="Search notebooks..."
                      className="text-xs"
                      value={search}
                      onValueChange={setSearch}
                    />
                    <CommandList>
                      <CommandGroup>
                        {isPending ? (
                          <div className="flex flex-col p-1 gap-y-1">
                            <ShimmeringLoader />
                            <ShimmeringLoader className="w-3/4" />
                          </div>
                        ) : !notebooks?.length ? (
                          <p className="text-xs text-center text-foreground-lighter py-3">
                            No notebooks found
                          </p>
                        ) : null}
                        {notebooks?.map((notebook) => (
                          <CommandItem
                            key={notebook.id}
                            value={notebook.id}
                            className="cursor-pointer"
                            onSelect={() => onAddToExistingNotebook(notebook.id)}
                          >
                            {notebook.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onClick={onAddToNewNotebook}>
                Create a new notebook
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ExplorerToolbarAction icon={<MoreVertical size={16} strokeWidth={2} />} />
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
