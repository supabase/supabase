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
import { useParams } from 'common'
import { FileText, Notebook, NotebookText, Play, Save, SquareCode } from 'lucide-react'
import { useEffect, useEffectEvent } from 'react'
import { AiIconAnimation, Button } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import {
  ExplorerToolbar,
  ExplorerToolbarAction,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from './ExplorerToolbar'
import { MarkdownCell } from './MarkdownCell'
import { QueryCell } from './QueryCell'
import { createMarkdownCellSkeleton, createQueryCellSkeleton } from './utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useCurrentNotebook, useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

export const NotebookEditor = () => {
  const { id } = useParams()
  const tabs = useTabsStateSnapshot()
  const snap = useNotebooksStateSnapshot()

  const currentNotebook = useCurrentNotebook()
  const { name, content } = currentNotebook?.notebook ?? {}
  const cells = content?.cells ?? []

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleSaveTitle = (titleValue: string) => {
    const trimmedName = titleValue.trim()
    if (id && trimmedName && trimmedName !== name) {
      snap.renameNotebook({ id, name: trimmedName })
      tabs.updateTab(createTabId('notebook', { id }), { label: trimmedName })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!id || !over || active.id === over.id) return

    snap.reorderCells({ id, activeCellId: active.id, overCellId: over.id })
  }

  const onSelectAddCell = (type: 'markdown' | 'query') => {
    const notebookId = currentNotebook?.notebook.id
    if (!notebookId) return

    const cell = type === 'markdown' ? createMarkdownCellSkeleton() : createQueryCellSkeleton()
    const lastCellId = cells[cells.length - 1]?.id

    snap.insertCellAfter({ id: notebookId, cellId: lastCellId, cell })
  }

  const registerTab = useEffectEvent(() => {
    if (!id) return
    tabs.addTab({
      id: createTabId('notebook', { id }),
      type: 'notebook',
      label: name ?? 'New Notebook',
      metadata: { notebookId: id },
      isPreview: false,
    })
  })

  useEffect(() => registerTab(), [id])

  return (
    <div className="flex flex-col h-full bg-surface-100">
      <ExplorerToolbar className="px-4">
        <ExplorerToolbarIcon>
          <NotebookText size={14} className="text-foreground-light" />
        </ExplorerToolbarIcon>
        <ExplorerToolbarTitle onSaveTitle={handleSaveTitle}>{name ?? ''}</ExplorerToolbarTitle>
        <ExplorerToolbarActions>
          <ExplorerToolbarAction icon={<AiIconAnimation size={16} />}>
            Analyze
          </ExplorerToolbarAction>
          <ExplorerToolbarAction icon={<Play />} tooltip="Run notebook" />
          <ExplorerToolbarAction icon={<Save />} tooltip="Save changes" />
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
                  items={cells.map((cell) => cell.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-y-4">
                    {cells.map((cell) => {
                      switch (cell._tag) {
                        case 'markdown_cell':
                          return <MarkdownCell key={cell.id} cell={cell} />

                        case 'database_cell':
                          return <QueryCell key={cell.id} cell={cell} />

                        case 'log_cell':
                          // [Joshen] Will eventually hook it up
                          return null
                      }
                    })}
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
    </div>
  )
}
