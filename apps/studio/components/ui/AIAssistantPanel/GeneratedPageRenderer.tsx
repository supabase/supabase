import { useParams } from 'common'
import { ChevronRight, LayoutDashboard, Maximize2, RotateCw, Square } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Button, cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import { Confirm } from './Confirm'
import type { ConfirmFooterApprovalState } from './Confirm.utils'
import {
  ExplorerToolbar,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from '@/components/interfaces/Explorer/ExplorerToolbar'
import { summarizeGeneratedPageCapabilities } from '@/components/interfaces/Explorer/GeneratedPage/generated-page.utils'
import { GeneratedPageFrame } from '@/components/interfaces/Explorer/GeneratedPage/GeneratedPageFrame'
import { useGeneratedPageRuntime } from '@/components/interfaces/Explorer/GeneratedPage/useGeneratedPageRuntime'
import { renderPageInputSchema } from '@/lib/ai/tools/generated-page-schema'
import { generateUuid } from '@/lib/api/snippets.browser'
import { addExplorerGeneratedPage } from '@/state/explorer-generated-page'

export type GeneratedPageState =
  | 'input-available'
  | 'approval-requested'
  | 'approval-responded'
  | 'output-denied'
  | 'output-available'
  | 'output-error'

export interface GeneratedPageRendererProps {
  state: GeneratedPageState
  input: unknown
  confirmState?: ConfirmFooterApprovalState
  onApprove?: () => void
  onDeny?: () => void
}

function QueryPreviewList({
  label,
  queries,
}: {
  label: string
  queries: ReadonlyArray<{ id: string; title: string; sql: string; detail: string }>
}) {
  const [isOpen, setIsOpen] = useState(false)

  if (queries.length === 0) return null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground-light hover:text-foreground">
        <ChevronRight
          size={14}
          strokeWidth={1.5}
          className={cn('transition-transform', isOpen && 'rotate-90')}
        />
        {label} ({queries.length})
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-3 px-3 pb-3">
        {queries.map((query) => (
          <div key={query.id} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-foreground">{query.title}</span>
              <span className="font-mono text-xs text-foreground-muted">{query.detail}</span>
            </div>
            <CodeBlock
              language="sql"
              value={query.sql}
              hideLineNumbers
              className="text-xs"
              wrapperClassName="max-h-48"
            />
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Approval card for a generated page in Assistant chat.
 *
 * This component owns the review UI — title, capability summary, expandable SQL previews,
 * and the approve/deny controls. Everything about actually running the page, including the
 * one place SQL is promoted, lives in `useGeneratedPageRuntime`, which the Explorer tab
 * shares.
 */
export const GeneratedPageRenderer = ({
  state,
  input,
  confirmState,
  onApprove,
  onDeny,
}: GeneratedPageRendererProps) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()

  const parsed = renderPageInputSchema.safeParse(input)
  const page = parsed.success ? parsed.data : undefined
  const runtime = useGeneratedPageRuntime({ page })

  const handleApprove = () => {
    runtime.start()
    onApprove?.()
  }

  /**
   * Moves the running page into its own Explorer tab. Only offered while the page is
   * already running, so this hands over an approval the user has already given rather than
   * creating a new one — nothing is promoted here.
   */
  const handleExpand = () => {
    const approvedQueries = runtime.getApprovedQueries()
    if (page === undefined || approvedQueries === null || projectRef === undefined) return

    const id = generateUuid()
    addExplorerGeneratedPage({ id, projectRef, page, approvedQueries })
    router.push(`/project/${projectRef}/explorer/page/${id}`)
  }

  if (!parsed.success || page === undefined) {
    return (
      <Confirm
        className="my-4"
        state={confirmState}
        message="Assistant wants to run a generated page"
        denyOnly
        onCancel={onDeny}
      >
        <div className="flex flex-col gap-2 p-3">
          <Admonition
            type="warning"
            title="Couldn't render this page"
            description="The assistant's input didn't match the expected shape. You can review the raw input below."
          />
          <CodeBlock
            language="json"
            value={JSON.stringify(input, null, 2)}
            hideLineNumbers
            className="text-xs"
            wrapperClassName="max-h-56"
          />
        </div>
      </Confirm>
    )
  }

  const canStartManually =
    !runtime.isRunning && (state === 'output-available' || state === 'output-error')

  return (
    <Confirm
      className="my-4"
      state={confirmState}
      message={`Assistant wants to run "${page.title}"`}
      cancelLabel="Skip"
      confirmLabel="Run page"
      confirmLabelLoading="Starting..."
      successMessage="Page running"
      errorMessage="Failed to start page"
      deniedMessage="Skipped page"
      onCancel={onDeny}
      onConfirm={handleApprove}
    >
      <ExplorerToolbar aria-label="Generated page toolbar">
        <ExplorerToolbarIcon>
          <LayoutDashboard size={16} strokeWidth={1.5} />
        </ExplorerToolbarIcon>
        <ExplorerToolbarTitle>{page.title}</ExplorerToolbarTitle>
        <ExplorerToolbarActions>
          {runtime.isRunning && (
            <>
              <Button
                size="tiny"
                variant="text"
                icon={<RotateCw size={14} strokeWidth={1.5} />}
                onClick={runtime.reload}
              >
                Reload
              </Button>
              <Button
                size="tiny"
                variant="text"
                icon={<Square size={14} strokeWidth={1.5} />}
                onClick={runtime.stop}
              >
                Stop
              </Button>
              <Button
                size="tiny"
                variant="text"
                icon={<Maximize2 size={14} strokeWidth={1.5} />}
                onClick={handleExpand}
              >
                Expand
              </Button>
            </>
          )}
          {canStartManually && (
            <Button size="tiny" variant="default" onClick={runtime.start}>
              Run page
            </Button>
          )}
        </ExplorerToolbarActions>
      </ExplorerToolbar>

      <p className="border-b px-3 py-2 text-xs text-foreground-light">
        {summarizeGeneratedPageCapabilities(page)}
      </p>

      {runtime.clientWarning !== null && (
        <div className="p-3">
          <Admonition
            type="warning"
            title={runtime.clientWarning.title}
            description={runtime.clientWarning.description}
          />
        </div>
      )}

      <QueryPreviewList
        label="Database queries"
        queries={page.database_queries.map((query) => ({
          id: query.id,
          title: query.title,
          sql: query.sql,
          detail: `${query.id} · limit ${query.row_limit}`,
        }))}
      />
      <QueryPreviewList
        label="Logs queries"
        queries={page.log_queries.map((query) => ({
          id: query.id,
          title: query.title,
          sql: query.sql,
          detail: query.id,
        }))}
      />

      {runtime.run !== null && (
        <GeneratedPageFrame
          key={runtime.run.id}
          ref={runtime.iframeRef}
          title={page.title}
          document={runtime.run.document}
          height={runtime.height}
          className="border-t"
          onLoad={runtime.handleIframeLoad}
        />
      )}
    </Confirm>
  )
}
