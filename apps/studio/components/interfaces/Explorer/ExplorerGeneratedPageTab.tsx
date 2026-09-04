import { useParams } from 'common'
import { LayoutDashboard, RotateCw, Square } from 'lucide-react'
import { useRouter } from 'next/router'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { ExplorerQueryResults, ExplorerQueryViewport } from './ExplorerQuery'
import {
  ExplorerToolbar,
  ExplorerToolbarAction,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from './ExplorerToolbar'
import { summarizeGeneratedPageCapabilities } from './GeneratedPage/generated-page.utils'
import { GeneratedPageFrame } from './GeneratedPage/GeneratedPageFrame'
import { useGeneratedPageRuntime } from './GeneratedPage/useGeneratedPageRuntime'
import {
  getExplorerGeneratedPage,
  useExplorerGeneratedPageSnapshot,
} from '@/state/explorer-generated-page'

/**
 * Explorer tab hosting a page the assistant generated and the user already approved in
 * chat. The definition and its approval are handed over in memory, so this tab lives only
 * for the current session — a hard refresh leaves nothing to run and says so.
 */
export const ExplorerGeneratedPageTab = () => {
  const router = useRouter()
  const { id, ref } = useParams()
  const snapshot = useExplorerGeneratedPageSnapshot()

  // Subscribe to presence through the snapshot, but read the entry itself from the store:
  // entries are immutable once added, and a snapshot would hand back deep-readonly copies
  // of the page definition and its carried-over approval.
  const hasEntry = id !== undefined && snapshot.pages[id] !== undefined
  const entry = hasEntry ? getExplorerGeneratedPage({ id, projectRef: ref }) : undefined

  const runtime = useGeneratedPageRuntime({
    page: entry?.page,
    approvedQueries: entry?.approvedQueries,
  })

  if (!entry) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-surface-100">
        <LayoutDashboard className="text-foreground-muted" size={24} />
        <div className="text-center">
          <p className="text-sm font-medium">This page is no longer available</p>
          <p className="text-sm text-foreground-lighter">
            Generated pages run only for the session they were approved in. Ask the Assistant to
            build it again.
          </p>
        </div>
        <Button onClick={() => router.push(`/project/${ref}/explorer`)}>Back to Explorer</Button>
      </div>
    )
  }

  return (
    <ExplorerQueryViewport>
      <ExplorerToolbar aria-label="Generated page toolbar">
        <ExplorerToolbarIcon>
          <LayoutDashboard size={16} strokeWidth={2} />
        </ExplorerToolbarIcon>
        <ExplorerToolbarTitle>{entry.page.title}</ExplorerToolbarTitle>
        <ExplorerToolbarActions>
          <span className="text-xs text-foreground-lighter">
            {summarizeGeneratedPageCapabilities(entry.page)}
          </span>
          <ExplorerToolbarAction
            aria-label="Reload page"
            tooltip="Reload page"
            icon={<RotateCw size={16} strokeWidth={2} />}
            onClick={runtime.reload}
          />
          <ExplorerToolbarAction
            aria-label="Stop page"
            tooltip="Stop page"
            icon={<Square size={16} strokeWidth={2} />}
            onClick={runtime.stop}
          />
        </ExplorerToolbarActions>
      </ExplorerToolbar>

      {runtime.clientWarning !== null && (
        <div className="border-b p-3">
          <Admonition
            type="warning"
            title={runtime.clientWarning.title}
            description={runtime.clientWarning.description}
          />
        </div>
      )}

      <ExplorerQueryResults>
        {runtime.run === null ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <p className="text-sm text-foreground-lighter">This page is stopped.</p>
            <Button variant="default" onClick={runtime.start}>
              Run page
            </Button>
          </div>
        ) : (
          <GeneratedPageFrame
            key={runtime.run.id}
            ref={runtime.iframeRef}
            title={entry.page.title}
            document={runtime.run.document}
            onLoad={runtime.handleIframeLoad}
          />
        )}
      </ExplorerQueryResults>
    </ExplorerQueryViewport>
  )
}
