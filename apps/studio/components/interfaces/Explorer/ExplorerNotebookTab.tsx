import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { acceptUntrustedSql } from '@supabase/pg-meta'
import { useQueryClient } from '@tanstack/react-query'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import {
  Check,
  Copy,
  Download,
  FileText,
  Keyboard,
  Loader2,
  MoreVertical,
  Notebook,
  NotebookText,
  Play,
  Save,
  SearchX,
  SquareCode,
  Trash,
} from 'lucide-react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  AiIconAnimation,
  Badge,
  Button,
  Checkbox,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  findQueryCellsMatchingSql,
  isMutatingSql,
  notebookToMarkdown,
  type QueryCellSummary,
} from './ExplorerNotebookTab.utils'
import {
  ExplorerToolbar,
  ExplorerToolbarAction,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from './ExplorerToolbar'
import { useAnalyzeNotebook, useLoadNotebook } from './hooks'
import { MarkdownCell } from './MarkdownCell'
import { QueryCell } from './QueryCell'
import { type QueryEditorHandle } from './QueryEditor'
import { createMarkdownCellSkeleton, createQueryCellSkeleton } from './utils'
import { checkDestructiveQuery } from '@/components/interfaces/SQLEditor/SQLEditor.utils'
import { useExplorerDeleteItem } from '@/components/layouts/ExplorerLayout/ExplorerProvider'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import {
  evictNotebookFromCaches,
  hasDiscardableChanges,
} from '@/data/content/notebooks/notebook-cache'
import {
  isQueryCell,
  WritableCell,
  WritableNotebook,
} from '@/data/content/notebooks/notebook-schema'
import { useUpsertNotebookMutation } from '@/data/content/notebooks/notebook-upsert-mutation'
import { acceptUntrustedLogsSql } from '@/data/logs/safe-analytics-sql'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import {
  getNotebooksStateSnapshot,
  useCurrentNotebook,
  useNotebooksStateSnapshot,
} from '@/state/notebooks/notebooks-state'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

export const ExplorerNotebookTab = () => {
  const { id, ref } = useParams()
  const tabs = useTabsStateSnapshot()
  const snap = useNotebooksStateSnapshot()
  const queryClient = useQueryClient()
  const { analyzeNotebook, isCreating } = useAnalyzeNotebook()
  const { onSelectDelete } = useExplorerDeleteItem()

  const [isIntellisenseEnabled, setIsIntellisenseEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE,
    true
  )

  const currentNotebook = useCurrentNotebook()
  const { name, content } = currentNotebook?.notebook ?? {}
  const { isNotFound } = useLoadNotebook({ id, projectRef: ref })
  const { data: project } = useSelectedProjectQuery()
  const cells = content?.cells ?? []
  const queryCellIds = cells.filter(isQueryCell).map((cell) => cell._id)

  const [isRunningNotebook, setIsRunningNotebook] = useState(false)
  const [isSaveBeforeAnalyzeOpen, setIsSaveBeforeAnalyzeOpen] = useState(false)
  const [isSaveConflictOpen, setIsSaveConflictOpen] = useState(false)
  const [pendingQueryMatches, setPendingQueryMatches] = useState<{
    destructiveQueries: QueryCellSummary[]
    mutatingQueries: QueryCellSummary[]
  } | null>(null)
  const [skipMutatingCells, setSkipMutatingCells] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const queryCellRefs = useRef(new Map<string, QueryEditorHandle>())
  const savedContentRef = useRef<typeof content>(undefined)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const { mutate: updateNotebook, isPending: isUpdating } = useUpsertNotebookMutation({
    onSuccess: (data) => {
      if (id && content === savedContentRef.current) {
        snap.markSaved({ id, updatedAt: data?.updated_at })
        toast.success('Successfully saved notebook!')
        if (isSaveBeforeAnalyzeOpen) {
          setIsSaveBeforeAnalyzeOpen(false)
          handleAnalyze()
        }
      }
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const persistNotebookTab = () => {
    const notebookId = currentNotebook?.notebook.id
    if (!notebookId) return

    tabs.makeTabPermanent(createTabId('notebook', { id: notebookId }))
  }

  const handleSaveTitle = (titleValue: string) => {
    persistNotebookTab()
    const trimmedName = titleValue.trim()
    if (id && trimmedName && trimmedName !== name) {
      snap.renameNotebook({ id, name: trimmedName })
      tabs.updateTab(createTabId('notebook', { id }), { label: trimmedName })
    }
  }

  const runNotebook = async ({
    cellIdsToRun,
    force = false,
  }: {
    cellIdsToRun: string[]
    force?: boolean
  }) => {
    persistNotebookTab()
    setIsRunningNotebook(true)

    try {
      await Promise.allSettled(
        cellIdsToRun.map((cellId) => queryCellRefs.current.get(cellId)?.run(force))
      )
    } finally {
      setIsRunningNotebook(false)
    }
  }

  const getFreshCells = () => {
    const freshNotebook = id ? getNotebooksStateSnapshot().notebooks[id] : undefined
    if (!freshNotebook || freshNotebook.projectRef !== ref) return cells
    return freshNotebook.notebook.content?.cells ?? []
  }

  const handleRunNotebook = () => {
    const freshCells = getFreshCells()
    const { destructiveQueries, mutatingQueries } = findQueryCellsMatchingSql({
      cells: freshCells,
      getLiveSql: (cellId) => queryCellRefs.current.get(cellId)?.getSql(),
      matchers: {
        destructiveQueries: checkDestructiveQuery,
        mutatingQueries: isMutatingSql,
      },
    })
    if (mutatingQueries.length === 0) {
      runNotebook({ cellIdsToRun: freshCells.filter(isQueryCell).map((cell) => cell._id) })
    } else {
      setSkipMutatingCells(false)
      setPendingQueryMatches({ destructiveQueries, mutatingQueries })
    }
  }

  const handleConfirmRunNotebook = () => {
    const mutatingCellIds = new Set(
      (pendingQueryMatches?.mutatingQueries ?? []).map((cell) => cell.id)
    )
    const freshCells = getFreshCells()
    const freshQueryCellIds = freshCells.filter(isQueryCell).map((cell) => cell._id)
    const cellIdsToRun = skipMutatingCells
      ? freshQueryCellIds.filter((id) => !mutatingCellIds.has(id))
      : freshQueryCellIds

    setPendingQueryMatches(null)
    runNotebook({ cellIdsToRun, force: true })
  }

  const persistNotebook = () => {
    const notebookId = currentNotebook?.notebook.id
    if (!ref || !notebookId || !name || !content) return

    persistNotebookTab()

    const writableContent: WritableNotebook = {
      schema_version: content.schema_version,
      cells: content.cells.map((cell): WritableCell => {
        switch (cell._tag) {
          case 'markdown_cell':
            return cell
          case 'database_cell': {
            const { unchecked_sql, chart, ...rest } = cell
            return {
              ...rest,
              chart: chart ? { ...chart, y_series: [...chart.y_series] } : undefined,
              sql: acceptUntrustedSql(unchecked_sql),
            }
          }
          case 'log_cell': {
            const { unchecked_sql, chart, ...rest } = cell
            return {
              ...rest,
              chart: chart ? { ...chart, y_series: [...chart.y_series] } : undefined,
              sql: acceptUntrustedLogsSql(unchecked_sql),
            }
          }
        }
      }),
    }

    if (snap.serverDivergedWhileDirty.get(notebookId) === 'deleted') {
      writableContent.cells = writableContent.cells.map(({ _id: _, ...cell }) => cell)
    }

    // [Joshen] For tracking if a notebook is updated while being saved, so that we do not
    // incorrectly show the saved toast if it's subsequently then saved once again while
    // the initial save is midflight
    savedContentRef.current = content

    updateNotebook({
      projectRef: ref,
      id: notebookId,
      name,
      description: currentNotebook?.notebook.description ?? undefined,
      content: writableContent,
    })
  }

  const handleSaveNotebook = () => {
    const notebookId = currentNotebook?.notebook.id
    if (notebookId && snap.serverDivergedWhileDirty.get(notebookId)) {
      setIsSaveConflictOpen(true)
      return
    }

    persistNotebook()
  }

  useShortcut(SHORTCUT_IDS.EXPLORER_NOTEBOOK_SAVE, handleSaveNotebook, {
    enabled: !!content && !isUpdating,
  })

  const handleSaveAnyway = () => {
    setIsSaveConflictOpen(false)
    persistNotebook()
  }

  const handleDiscardNotebookChanges = async () => {
    if (!ref || !id) return

    const wasDeletedOnServer = snap.serverDivergedWhileDirty.get(id) === 'deleted'
    setIsSaveConflictOpen(false)
    const evicted = await evictNotebookFromCaches({ queryClient, projectRef: ref, id })
    if (wasDeletedOnServer && evicted) {
      tabs.removeTab(createTabId('notebook', { id }))
    }
  }

  const handleAnalyze = () => analyzeNotebook({ id, name })

  const handleClickAnalyze = () => {
    if (hasDiscardableChanges(currentNotebook)) {
      setIsSaveBeforeAnalyzeOpen(true)
    } else {
      handleAnalyze()
    }
  }

  const handleCopyAsMarkdown = async () => {
    try {
      await copyToClipboard(
        notebookToMarkdown({
          name: name ?? '',
          cells,
          getResult: (cellId) => queryCellRefs.current.get(cellId)?.getResult(),
        }),
        () => toast.success('Copied notebook as Markdown to clipboard')
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error('Failed to copy notebook as Markdown: ' + message)
    }
  }

  const handleExportPdf = async () => {
    setIsExportingPdf(true)
    try {
      const { exportNotebookToPdf } = await import('./NotebookPdf/exportNotebookToPdf')
      await exportNotebookToPdf({
        name: name ?? 'Untitled notebook',
        projectName: project?.name,
        cells,
        getResult: (cellId) => queryCellRefs.current.get(cellId)?.getResult(),
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error('Failed to export notebook as PDF: ' + message)
    } finally {
      setIsExportingPdf(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    persistNotebookTab()

    const { active, over } = event
    if (!id || !over || active.id === over.id) return

    snap.reorderCells({ id, activeCellId: active.id, overCellId: over.id })
  }

  const onSelectAddCell = (type: 'markdown' | 'query') => {
    persistNotebookTab()

    const notebookId = currentNotebook?.notebook.id
    if (!notebookId) return

    const cell = type === 'markdown' ? createMarkdownCellSkeleton() : createQueryCellSkeleton()
    const lastCellId = cells[cells.length - 1]?._id

    snap.insertCellAfter({ id: notebookId, cellId: lastCellId, cell })
  }

  const scrollToBottomIfPending = useEffectEvent(() => {
    if (!id || snap.pendingScrollToBottom !== id || !scrollContainerRef.current) return

    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
    })
    snap.clearPendingScrollToBottom()
  })

  useEffect(() => scrollToBottomIfPending(), [id, snap.pendingScrollToBottom, content])

  if (isNotFound) {
    return (
      <div className="p-4 h-full bg-surface-100">
        <EmptyStatePresentational
          icon={<SearchX className="text-foreground-lighter" />}
          title="Notebook not found"
          description="This notebook may have been deleted or does not exist."
          contentClassName="[&>h3]:text-sm [&>p]:text-xs"
        />
      </div>
    )
  }

  if (!content) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-surface-100">
        <Loader2 className="animate-spin text-foreground-muted" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-surface-100">
      <ExplorerToolbar className="px-4">
        <ExplorerToolbarIcon>
          <NotebookText size={16} strokeWidth={2} />
        </ExplorerToolbarIcon>
        <ExplorerToolbarTitle onSaveTitle={handleSaveTitle}>{name ?? ''}</ExplorerToolbarTitle>
        <ExplorerToolbarActions>
          <ExplorerToolbarAction
            className="group"
            icon={
              <AiIconAnimation
                size={16}
                className="text-tertiary-foreground group-hover:text-primary"
              />
            }
            loading={isCreating}
            disabled={cells.length === 0}
            tooltip={cells.length === 0 ? 'Add a cell to the notebook to analyze it' : undefined}
            onClick={handleClickAnalyze}
          >
            Analyze
          </ExplorerToolbarAction>
          <ShortcutTooltip
            side="bottom"
            shortcutId={SHORTCUT_IDS.EXPLORER_NOTEBOOK_SAVE}
            label="Save changes"
          >
            <ExplorerToolbarAction
              aria-label="Save changes"
              icon={<Save size={16} strokeWidth={2} />}
              loading={isUpdating}
              onClick={handleSaveNotebook}
            />
          </ShortcutTooltip>
          <ExplorerToolbarActions>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ExplorerToolbarAction
                  aria-label="More options"
                  icon={<MoreVertical size={16} strokeWidth={2} />}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  className="justify-between"
                  onClick={() => setIsIntellisenseEnabled(!isIntellisenseEnabled)}
                >
                  <div className="flex items-center gap-x-2">
                    <Keyboard size={14} />
                    <span>Intellisense enabled</span>
                  </div>
                  {isIntellisenseEnabled && <Check className="text-primary" size={16} />}
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-x-2" onClick={handleCopyAsMarkdown}>
                  <Copy size={14} />
                  <span>Copy as Markdown</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-x-2"
                  disabled={isExportingPdf}
                  onClick={handleExportPdf}
                >
                  {isExportingPdf ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  <span>Export as PDF</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-x-2"
                  onClick={() => id && onSelectDelete({ id, type: 'notebook', name: name ?? '' })}
                >
                  <Trash size={14} />
                  <span>Delete notebook</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ExplorerToolbarActions>
          <ButtonTooltip
            type="button"
            variant="default"
            size="tiny"
            className="ml-1"
            aria-label="Run notebook"
            icon={<Play size={16} strokeWidth={2} />}
            tooltip={{ content: { side: 'bottom', text: 'Run notebook' } }}
            loading={isRunningNotebook}
            disabled={queryCellIds.length === 0}
            onClick={handleRunNotebook}
          >
            Run
          </ButtonTooltip>
        </ExplorerToolbarActions>
      </ExplorerToolbar>

      <div ref={scrollContainerRef} className="w-full mx-auto flex-grow min-h-0 overflow-y-auto">
        <div className="p-4 pb-10">
          {cells.length === 0 && (
            <EmptyStatePresentational
              icon={<Notebook className="text-foreground-lighter" />}
              title="This notebook is empty"
              description="Add a query cell to run SQL against your database or logs."
              contentClassName="[&>h3]:text-sm [&>p]:text-xs"
            >
              <div className="flex items-center gap-x-2">
                <Button onClick={() => onSelectAddCell('query')}>Add query</Button>
                <Button onClick={() => onSelectAddCell('markdown')}>Add markdown</Button>
              </div>
            </EmptyStatePresentational>
          )}
          {cells.length > 0 && (
            <>
              <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={cells.map((cell) => cell._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-y-4">
                    {cells.map((cell) =>
                      isQueryCell(cell) ? (
                        <QueryCell
                          key={cell._id}
                          cell={cell}
                          onEdit={persistNotebookTab}
                          onPrettifyQuery={() => queryCellRefs.current.get(cell._id)?.prettify()}
                          ref={(instance) => {
                            if (instance) queryCellRefs.current.set(cell._id, instance)
                            else queryCellRefs.current.delete(cell._id)
                          }}
                        />
                      ) : (
                        <MarkdownCell key={cell._id} cell={cell} onEdit={persistNotebookTab} />
                      )
                    )}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="flex items-center justify-center gap-x-2 mt-4">
                <ButtonTooltip
                  variant="outline"
                  size="small"
                  icon={<SquareCode />}
                  className="w-[34px]"
                  onClick={() => onSelectAddCell('query')}
                  tooltip={{ content: { side: 'bottom', text: 'Add query' } }}
                />
                <ButtonTooltip
                  variant="outline"
                  size="small"
                  icon={<FileText />}
                  className="w-[34px]"
                  onClick={() => onSelectAddCell('markdown')}
                  tooltip={{ content: { side: 'bottom', text: 'Add markdown' } }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmationModal
        size="small"
        visible={isSaveBeforeAnalyzeOpen}
        title="Save notebook before analyzing?"
        confirmLabel="Save and analyze"
        confirmLabelLoading="Saving notebook"
        loading={isUpdating}
        onCancel={() => setIsSaveBeforeAnalyzeOpen(false)}
        onConfirm={handleSaveNotebook}
      >
        <p className="text-sm">
          This notebook has unsaved changes. Save it first so the assistant analyzes the latest
          content.
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        size="small"
        visible={isSaveConflictOpen}
        title="Notebook changed on the server"
        additionalActionLabel="Discard changes"
        confirmLabel={
          id && snap.serverDivergedWhileDirty.get(id) === 'deleted' ? 'Recreate' : 'Save anyway'
        }
        onAdditionalAction={handleDiscardNotebookChanges}
        onCancel={() => setIsSaveConflictOpen(false)}
        onConfirm={handleSaveAnyway}
      >
        <p className="text-sm">
          {id && snap.serverDivergedWhileDirty.get(id) === 'deleted'
            ? 'This notebook was deleted on the server after your local changes. Saving will recreate it.'
            : 'This notebook changed on the server after your local changes. Saving will overwrite those changes.'}
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        size="small"
        visible={pendingQueryMatches !== null}
        title="Confirm to run notebook"
        confirmLabel={skipMutatingCells ? 'Run read-only cells' : 'Run all cells'}
        variant="warning"
        onCancel={() => setPendingQueryMatches(null)}
        onConfirm={handleConfirmRunNotebook}
      >
        <p className="text-sm">
          This notebook has {pendingQueryMatches?.mutatingQueries.length ?? 0}{' '}
          {pendingQueryMatches?.mutatingQueries.length === 1 ? 'query' : 'queries'} that{' '}
          {pendingQueryMatches?.mutatingQueries.length === 1 ? 'modifies' : 'modify'} data or schema
          and cannot be undone once run:
        </p>
        <ul className="text-sm list-disc pl-4 mt-2">
          {pendingQueryMatches?.mutatingQueries.map((cell) => (
            <li key={cell.id} className="flex items-center gap-2">
              {cell.title}
              {pendingQueryMatches.destructiveQueries.some(({ id }) => id === cell.id) && (
                <Badge variant="destructive">Destructive</Badge>
              )}
            </li>
          ))}
        </ul>
        <FormItemLayout
          isReactForm={false}
          layout="flex"
          id="skipMutatingCells"
          label="Skip these queries"
          description="Run only the read-only cells in this notebook"
          className="mt-4 [&>div:first-child>button]:translate-y-0.5"
        >
          <Checkbox
            id="skipMutatingCells"
            checked={skipMutatingCells}
            onCheckedChange={(value) => setSkipMutatingCells(!!value)}
          />
        </FormItemLayout>
      </ConfirmationModal>
    </div>
  )
}
