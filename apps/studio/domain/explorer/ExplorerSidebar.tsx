import { RegistryContext, useAtomValue } from '@effect/atom-react'
import { useIntersectionObserver } from '@uidotdev/usehooks'
import { AsyncResult } from 'effect/unstable/reactivity'
import { NotebookText } from 'lucide-react'
import { useCallback, useContext, useRef } from 'react'
import { ScrollArea } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import type { NotebookSummary } from '../notebooks/notebook.schema'
import { notebooksAtoms } from '../notebooks/notebooks.atoms'
import { explorerTabs } from './explorer.tabs'
import { useLoadMoreOnIntersect } from './useLoadMoreOnIntersect'
import { withProjectRef } from '@/domain/project/withProjectRef'

const NotebooksSkeleton = () => (
  <div className="flex flex-col gap-y-2 px-2 py-1" data-testid="notebooks-skeleton">
    <ShimmeringLoader className="py-2" />
    <ShimmeringLoader className="w-4/5 py-2" />
  </div>
)

const NotebookListItem = ({ notebook }: { notebook: NotebookSummary }) => {
  const registry = useContext(RegistryContext)

  return (
    <button
      type="button"
      tabIndex={0}
      className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground-light hover:bg-surface-200 hover:text-foreground"
      onClick={() =>
        explorerTabs.addTab(registry, {
          _tag: 'NotebookTab',
          notebookId: notebook.id,
          label: notebook.name,
        })
      }
    >
      <NotebookText size={14} className="shrink-0 text-foreground-muted" />
      <span className="truncate">{notebook.name}</span>
    </button>
  )
}

const ExplorerSidebarInner = ({ projectRef }: { projectRef: string }) => {
  const registry = useContext(RegistryContext)

  const scrollRootRef = useRef<HTMLDivElement | null>(null)
  const [sentinelRef, entry] = useIntersectionObserver({
    root: scrollRootRef.current,
    threshold: 0,
    rootMargin: '0px',
  })

  const result = useAtomValue(notebooksAtoms.notebooksAtom(projectRef))
  const canLoadMore = useAtomValue(notebooksAtoms.canLoadMoreAtom(projectRef))

  const loadMore = useCallback(
    () => notebooksAtoms.loadMoreNotebooks(registry, projectRef),
    [registry, projectRef]
  )
  useLoadMoreOnIntersect({ isIntersecting: entry?.isIntersecting, canLoadMore, loadMore })

  return (
    <aside
      aria-label="Notebooks"
      className="flex h-full w-64 shrink-0 flex-col border-r bg-surface-100"
    >
      <div className="border-b px-3 py-2">
        <span className="text-sm font-medium text-foreground">Notebooks</span>
      </div>
      <ScrollArea ref={scrollRootRef} className="flex-1">
        <div className="flex flex-col gap-y-0.5 p-2">
          {AsyncResult.builder(result)
            .onInitial(() => <NotebooksSkeleton />)
            .onErrorTag('NoSuchElementError', () => (
              <p className="px-2 py-1 text-xs text-foreground-lighter">No notebooks yet</p>
            ))
            .onErrorTag('ListNotebooksError', () => (
              <p className="px-2 py-1 text-xs text-destructive">Failed to load notebooks</p>
            ))
            .onDefect(() => (
              <p className="px-2 py-1 text-xs text-destructive">Failed to load notebooks</p>
            ))
            .onInterrupt(() => null)
            .onSuccess((value, success) => (
              <>
                {value.items.map((notebook) => (
                  <NotebookListItem key={notebook.id} notebook={notebook} />
                ))}
                {!value.done && <div ref={sentinelRef} className="h-1 shrink-0" />}
                {success.waiting && <NotebooksSkeleton />}
              </>
            ))
            .exhaustive()}
        </div>
      </ScrollArea>
    </aside>
  )
}

const ExplorerSidebarFallback = (
  <aside
    aria-label="Notebooks"
    className="flex h-full w-64 shrink-0 flex-col items-center justify-center border-r bg-surface-100 p-4"
  >
    <p className="text-center text-xs text-foreground-lighter">No active project</p>
  </aside>
)

export const ExplorerSidebar = withProjectRef(ExplorerSidebarInner, ExplorerSidebarFallback)
