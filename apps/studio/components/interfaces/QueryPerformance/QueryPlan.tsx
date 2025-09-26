import { type PropsWithChildren, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ChevronsUpDown } from 'lucide-react'

import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { removeCommentsFromSql } from 'lib/helpers'
import { useExplainPlanQuery } from './hooks/useExplainPlanQuery'
import { QueryPanelSection } from './QueryPanel'
import { useFlag } from 'common/feature-flags'
import { SVG } from 'ui-patterns/info-tooltip'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  WarningIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Button_Shadcn_,
  Button,
  cn,
  Dialog,
  DialogContent,
} from 'ui'

type WarningMessageProps = PropsWithChildren<{ title: string }>
const WarningMessage = ({ title, children }: WarningMessageProps) => {
  return (
    <div className="h-full flex items-center">
      <Alert_Shadcn_ variant="warning" className="w-full">
        <WarningIcon />
        <AlertTitle_Shadcn_>{title}</AlertTitle_Shadcn_>
        {children && <AlertDescription_Shadcn_>{children}</AlertDescription_Shadcn_>}
      </Alert_Shadcn_>
    </div>
  )
}

/**
 * Load the query plan visualizer client-side only (does not behave well server-side)
 * @reference apps/studio/components/interfaces/SQLEditor/SQLEditor.tsx
 */
const QueryPlanVisualizer = dynamic(
  () =>
    import('components/ui/QueryPlan/query-plan-visualizer').then(
      ({ QueryPlanVisualizer }) => QueryPlanVisualizer
    ),
  { ssr: false }
)

export const QueryPlan = ({ query }: { query: string }) => {
  const isQueryPlanEnabled = useFlag('EnableQueryPlan')
  const { data: project } = useSelectedProjectQuery()
  const projectRef = project?.ref
  const connectionString = project?.connectionString

  const [isQueryPlanVisualizerExpanded, setIsQueryPlanVisualizerExpanded] = useState(false)
  const dialogContentRef = useRef<HTMLDivElement | null>(null)

  const cleanedSql = useMemo(() => {
    const cleanedSql = removeCommentsFromSql(query)
    const normalized = cleanedSql.replace(/\s+/g, ' ').trim()
    return normalized.replace(/;\s*$/, '')
  }, [query])

  const {
    data: rawExplainResult,
    error: queryError,
    isFetching,
    validationError,
  } = useExplainPlanQuery({
    projectRef,
    connectionString,
    cleanedSql,
  })

  const isUnsupportedQueryType =
    validationError?.id === 'unsupported-query-type' ||
    validationError?.id === 'explain-not-run-for-parameterized-query'

  const explainError = useMemo(() => {
    if (isUnsupportedQueryType) return null
    if (validationError) return validationError
    if (!queryError) return null

    const message =
      typeof queryError === 'object' && queryError !== null && 'message' in queryError
        ? (queryError as { message?: string }).message
        : undefined

    return {
      title: 'Failed to run EXPLAIN',
      message: message ?? 'An unexpected error occurred.',
    }
  }, [isUnsupportedQueryType, queryError, validationError])

  const explainJsonString = useMemo(() => {
    if (!rawExplainResult || rawExplainResult.length === 0) return null

    const value = rawExplainResult[0]['QUERY PLAN']
    if (!value) return null

    try {
      return JSON.stringify(value)
    } catch {
      return null
    }
  }, [rawExplainResult])

  if (!isQueryPlanEnabled || isUnsupportedQueryType) {
    return null
  }

  return (
    <QueryPanelSection className="pt-6 border-b relative">
      <div className="flex items-center mb-2">
        <h4>Query plan</h4>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button_Shadcn_ asChild size="icon" variant="link">
              <Link
                href="https://supabase.com/docs/guides/troubleshooting/understanding-postgresql-explain-output-Un9dqX"
                target="_blank"
                rel="noreferrer"
                aria-label="Learn how to read EXPLAIN"
                className="h-auto"
              >
                <SVG strokeWidth={2} className="transition-colors fill-foreground-muted w-4 h-4" />
              </Link>
            </Button_Shadcn_>
          </TooltipTrigger>
          <TooltipContent>What is a query plan?</TooltipContent>
        </Tooltip>
      </div>
      <div
        className={cn(
          'overflow-hidden pb-0 z-0 relative transition-all duration-300',
          explainError ? 'pb-6' : 'h-[200px]'
        )}
      >
        <p className="text-xs text-foreground-light mb-4">
          Visualize how Postgres executes your SQL so you can pinpoint costly steps faster.
        </p>
        {explainError && (
          <WarningMessage title={explainError.title || 'Failed to run EXPLAIN'}>
            <div className="space-y-3">
              <div className="whitespace-pre-wrap">{explainError.message}</div>
              <Button asChild type="default" size="tiny">
                <Link href="/support/new" target="_blank" rel="noreferrer">
                  Contact support
                </Link>
              </Button>
            </div>
          </WarningMessage>
        )}
        {isFetching && <GenericSkeletonLoader />}
        {explainJsonString && (
          <Dialog
            open={isQueryPlanVisualizerExpanded}
            onOpenChange={setIsQueryPlanVisualizerExpanded}
          >
            <div className="h-[420px]">
              <QueryPlanVisualizer
                json={explainJsonString}
                className="h-full"
                isExpanded={isQueryPlanVisualizerExpanded}
                setIsExpanded={setIsQueryPlanVisualizerExpanded}
                renderExpandedContent={(content) => (
                  <DialogContent
                    size="xxxlarge"
                    hideClose
                    ref={dialogContentRef}
                    // Keep initial focus inside the dialog so tooltips in the metrics sidebar stay closed
                    onOpenAutoFocus={(event) => {
                      event.preventDefault()
                      requestAnimationFrame(() => {
                        dialogContentRef.current?.focus({ preventScroll: true })
                      })
                    }}
                    tabIndex={-1}
                    className="rounded-lg flex h-[92vh] max-h-[96vh] w-[96vw] !max-w-[96vw] flex-col overflow-hidden border bg-background p-0 shadow-2xl focus:outline-none"
                  >
                    {content}
                  </DialogContent>
                )}
              />
            </div>
          </Dialog>
        )}
      </div>
      {!explainError && (
        <>
          <div
            className={cn(
              'absolute left-0 bottom-0 w-full bg-gradient-to-t from-black/30 to-transparent h-44 transition-opacity duration-300',
              isQueryPlanVisualizerExpanded && 'opacity-0 pointer-events-none'
            )}
          />
          <div className="absolute -bottom-[13px] left-0 right-0 w-full flex items-center justify-center z-10">
            <Button
              type="default"
              className="rounded-full"
              icon={<ChevronsUpDown />}
              onClick={() => setIsQueryPlanVisualizerExpanded((prev) => !prev)}
            >
              {isQueryPlanVisualizerExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </>
      )}
    </QueryPanelSection>
  )
}
