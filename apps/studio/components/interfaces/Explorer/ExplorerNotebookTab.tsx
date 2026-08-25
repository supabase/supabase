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
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import {
  Check,
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
import { useRouter } from 'next/router'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  AiIconAnimation,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { findMutatingQueryCells } from './ExplorerNotebookTab.utils'
import {
  ExplorerToolbar,
  ExplorerToolbarAction,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from './ExplorerToolbar'
import { useCreateChat, useLoadNotebook } from './hooks'
import { MarkdownCell } from './MarkdownCell'
import { QueryCell } from './QueryCell'
import { type QueryEditorHandle } from './QueryEditor'
import { createMarkdownCellSkeleton, createQueryCellSkeleton } from './utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useContentDeleteMutation } from '@/data/content/content-delete-mutation'
import {
  isQueryCell,
  WritableCell,
  WritableNotebook,
} from '@/data/content/notebooks/notebook-schema'
import { useUpsertNotebookMutation } from '@/data/content/notebooks/notebook-upsert-mutation'
import { acceptUntrustedLogsSql } from '@/data/logs/safe-analytics-sql'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import {
  getNotebooksStateSnapshot,
  useCurrentNotebook,
  useNotebooksStateSnapshot,
} from '@/state/notebooks/notebooks-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

export const ExplorerNotebookTab = () => {
  const router = useRouter()
  const { id, ref } = useParams()
  const tabs = useTabsStateSnapshot()
  const snap = useNotebooksStateSnapshot()
  const { createChat, isCreating } = useCreateChat()

  const [isIntellisenseEnabled, setIsIntellisenseEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE,
    true
  )

  const currentNotebook = useCurrentNotebook()
  const { name, content } = currentNotebook?.notebook ?? {}
  const { isNotFound } = useLoadNotebook({ id, projectRef: ref })
  const cells = content?.cells ?? []
  const queryCellIds = cells.filter(isQueryCell).map((cell) => cell._id)

  const [isRunningNotebook, setIsRunningNotebook] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [pendingMutationCells, setPendingMutationCells] = useState<
    { id: string; title: string }[] | null
  >(null)
  const [skipMutatingCells, setSkipMutatingCells] = useState(false)
  const queryCellRefs = useRef(new Map<string, QueryEditorHandle>())
  const savedContentRef = useRef<typeof content>(undefined)

  const { mutate: updateNotebook, isPending: isUpdating } = useUpsertNotebookMutation({
    onSuccess: () => {
      if (id && content === savedContentRef.current) {
        snap.markSaved({ id })
        toast.success('Successfully saved notebook!')
      }
    },
  })

  const { mutate: deleteNotebook, isPending: isDeleting } = useContentDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted notebook')
      if (id) {
        tabs.removeTab(createTabId('notebook', { id }))
        snap.removeNotebook({ id })
      }
      setIsDeleteModalOpen(false)
      router.push(`/project/${ref}/explorer`)
    },
    onError: (error) => toast.error(`Failed to delete notebook: ${error.message}`),
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
    const mutatingCells = findMutatingQueryCells({
      cells: freshCells,
      getLiveSql: (cellId) => queryCellRefs.current.get(cellId)?.getSql(),
    })
    if (mutatingCells.length === 0) {
      runNotebook({ cellIdsToRun: freshCells.filter(isQueryCell).map((cell) => cell._id) })
    } else {
      setSkipMutatingCells(false)
      setPendingMutationCells(mutatingCells)
    }
  }

  const handleConfirmRunNotebook = () => {
    const mutatingCellIds = new Set((pendingMutationCells ?? []).map((cell) => cell.id))
    const cellIdsToRun = skipMutatingCells
      ? queryCellIds.filter((id) => !mutatingCellIds.has(id))
      : queryCellIds

    setPendingMutationCells(null)
    runNotebook({ cellIdsToRun, force: true })
  }

  const handleSaveNotebook = () => {
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

    // [Joshen] For tracking if a notebook is updated while being saved, so that we do not
    // incorrectly show the saved toast if it's subsequently then saved once again while
    // the initial save is midflight
    savedContentRef.current = content

    updateNotebook({
      projectRef: ref,
      id: notebookId,
      name,
      description: currentNotebook?.notebook.description,
      content: writableContent,
    })
  }

  const handleConfirmDeleteNotebook = () => {
    if (!ref || !id) return
    deleteNotebook({ projectRef: ref, ids: [id] })
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
          <NotebookText size={14} className="text-foreground-light" />
        </ExplorerToolbarIcon>
        <ExplorerToolbarTitle onSaveTitle={handleSaveTitle}>{name ?? ''}</ExplorerToolbarTitle>
        <ExplorerToolbarActions>
          <ExplorerToolbarAction
            icon={<AiIconAnimation size={16} />}
            loading={isCreating}
            onClick={() => {
              createChat({
                name: `Analyze ${name} notebook`,
                initialMessage: `Run the notebook "${name}" (id: ${id}) and analyze the results. Summarize the key findings per cell, calling out anomalies or trends, and use any markdown cells for context. Skip or flag any cell that would mutate data rather than running it.`,
              })
            }}
          >
            Analyze
          </ExplorerToolbarAction>
          <ExplorerToolbarAction
            aria-label="Run notebook"
            icon={<Play />}
            tooltip="Run notebook"
            loading={isRunningNotebook}
            disabled={queryCellIds.length === 0}
            onClick={handleRunNotebook}
          />
          <ExplorerToolbarAction
            aria-label="Save changes"
            icon={<Save />}
            tooltip="Save changes"
            loading={isUpdating}
            onClick={handleSaveNotebook}
          />
          <ExplorerToolbarActions>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ExplorerToolbarAction aria-label="More options" icon={<MoreVertical />} />
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
                  {isIntellisenseEnabled && <Check className="text-brand" size={16} />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-x-2" onClick={() => setIsDeleteModalOpen(true)}>
                  <Trash size={14} />
                  <span>Delete notebook</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ExplorerToolbarActions>
        </ExplorerToolbarActions>
      </ExplorerToolbar>

      <div className="w-full mx-auto flex-grow min-h-0 overflow-y-auto">
        <div className="p-4 pb-10">
          {cells.length === 0 && (
            <EmptyStatePresentational
              icon={<Notebook className="text-foreground-lighter" />}
              title="This notebook is empty"
              description="Add a query cell to run SQL against your database or logs."
              contentClassName="[&>h3]:text-sm [&>p]:text-xs"
            >
              <div className="flex items-center gap-x-2">
                <Button variant="default" onClick={() => onSelectAddCell('query')}>
                  Add query cell
                </Button>
                <Button variant="default" onClick={() => onSelectAddCell('markdown')}>
                  Add markdown cell
                </Button>
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
                  icon={<SquareCode />}
                  className="w-7"
                  onClick={() => onSelectAddCell('query')}
                  tooltip={{ content: { side: 'bottom', text: 'Add query cell' } }}
                />
                <ButtonTooltip
                  variant="outline"
                  icon={<FileText />}
                  className="w-7"
                  onClick={() => onSelectAddCell('markdown')}
                  tooltip={{ content: { side: 'bottom', text: 'Add markdown cell' } }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmationModal
        size="small"
        visible={isDeleteModalOpen}
        title={`Confirm to delete notebook '${name ?? ''}'`}
        confirmLabel="Delete notebook"
        confirmLabelLoading="Deleting notebook"
        variant="destructive"
        loading={isDeleting}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteNotebook}
      >
        <p className="text-sm">
          This action cannot be undone. Are you sure you want to delete '{name}'?
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        size="small"
        visible={pendingMutationCells !== null}
        title="Confirm to run notebook"
        confirmLabel={skipMutatingCells ? 'Run read-only cells' : 'Run all cells'}
        variant="warning"
        onCancel={() => setPendingMutationCells(null)}
        onConfirm={handleConfirmRunNotebook}
      >
        <p className="text-sm">
          This notebook has {pendingMutationCells?.length ?? 0}{' '}
          {pendingMutationCells?.length === 1 ? 'query' : 'queries'} that{' '}
          {pendingMutationCells?.length === 1 ? 'modifies' : 'modify'} data or schema and cannot be
          undone once run:
        </p>
        <ul className="text-sm list-disc pl-4 mt-2">
          {pendingMutationCells?.map((cell) => (
            <li key={cell.id}>{cell.title}</li>
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
