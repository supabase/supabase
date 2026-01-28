import { Check, Table2, Lightbulb } from 'lucide-react'
import { useState, useEffect } from 'react'

import { AccordionTrigger } from '@ui/components/shadcn/ui/accordion'
import { useIndexAdvisorStatus } from 'components/interfaces/QueryPerformance/hooks/useIsIndexAdvisorStatus'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { Admonition } from 'ui-patterns'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useGetIndexAdvisorResult } from 'data/database/retrieve-index-advisor-result-query'
import { useGetIndexesFromSelectQuery } from 'data/database/retrieve-index-from-select-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { useTrack } from 'lib/telemetry/track'
import {
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  Accordion_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CodeBlock,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  cn,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { useIndexInvalidation } from './hooks/useIndexInvalidation'
import { EnableIndexAdvisorButton } from './IndexAdvisor/EnableIndexAdvisorButton'
import {
  calculateImprovement,
  createIndexes,
  hasIndexRecommendations,
} from './IndexAdvisor/index-advisor.utils'
import { QueryPerformanceRow } from './QueryPerformance.types'
import { IndexAdvisorDisabledState } from './IndexAdvisor/IndexAdvisorDisabledState'
import { IndexImprovementText } from './IndexAdvisor/IndexImprovementText'
import { QueryPanelContainer, QueryPanelScoreSection, QueryPanelSection } from './QueryPanel'

interface QueryIndexesProps {
  selectedRow: Pick<QueryPerformanceRow, 'query'>
  columnName?: string
  suggestedSelectQuery?: string

  onClose?: () => void
}

// [Joshen] There's several more UX things we can do to help ease the learning curve of indexes I think
// e.g understanding "costs", what numbers of "costs" are actually considered insignificant

export const QueryIndexes = ({
  selectedRow,
  columnName,
  suggestedSelectQuery,
  onClose,
}: QueryIndexesProps) => {
  // [Joshen] TODO implement this logic once the linter rules are in
  const isLinterWarning = false
  const { data: project } = useSelectedProjectQuery()
  const [showStartupCosts, setShowStartupCosts] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const track = useTrack()
  const [hasTrackedTabView, setHasTrackedTabView] = useState(false)

  const {
    data: usedIndexes,
    isSuccess,
    isPending: isLoading,
    isError,
    error,
  } = useGetIndexesFromSelectQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    query: selectedRow?.['query'],
  })

  const { data: extensions, isPending: isLoadingExtensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { isIndexAdvisorEnabled } = useIndexAdvisorStatus()

  const {
    data: indexAdvisorResult,
    error: indexAdvisorError,
    refetch,
    isError: isErrorIndexAdvisorResult,
    isSuccess: isSuccessIndexAdvisorResult,
    isLoading: isLoadingIndexAdvisorResult,
  } = useGetIndexAdvisorResult(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      query: selectedRow?.['query'],
    },
    { enabled: isIndexAdvisorEnabled }
  )

  const {
    index_statements,
    startup_cost_after,
    startup_cost_before,
    total_cost_after,
    total_cost_before,
  } = indexAdvisorResult ?? { index_statements: [], total_cost_after: 0, total_cost_before: 0 }
  const hasIndexRecommendation = hasIndexRecommendations(
    indexAdvisorResult,
    isSuccessIndexAdvisorResult
  )
  const totalImprovement = calculateImprovement(total_cost_before, total_cost_after)

  const invalidateQueries = useIndexInvalidation()

  useEffect(() => {
    if (!isLoadingIndexAdvisorResult && !hasTrackedTabView) {
      track('index_advisor_tab_clicked', {
        hasRecommendations: hasIndexRecommendation,
        isIndexAdvisorEnabled: isIndexAdvisorEnabled,
      })
      setHasTrackedTabView(true)
    }
  }, [
    isLoadingIndexAdvisorResult,
    hasIndexRecommendation,
    hasTrackedTabView,
    track,
    isIndexAdvisorEnabled,
  ])

  const createIndex = async () => {
    if (index_statements.length === 0) return

    setIsExecuting(true)
    track('index_advisor_create_indexes_button_clicked')

    try {
      await createIndexes({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        indexStatements: index_statements,
        onSuccess: () => refetch(),
      })

      // Only invalidate queries if index creation was successful
      invalidateQueries()
    } catch (error) {
      // Error is already handled by createIndexes with a toast notification
      // But we could add component-specific error handling here if needed
      console.error('Failed to create index:', error)
      setIsExecuting(false)
    } finally {
      setIsExecuting(false)

      onClose?.()
    }
  }

  if (!isLoadingExtensions && !isIndexAdvisorEnabled) {
    return (
      <QueryPanelContainer className="h-full">
        <QueryPanelSection className="pt-2">
          <div className="border rounded border-dashed flex flex-col items-center justify-center py-4 px-12 gap-y-1 text-center">
            <p className="text-sm text-foreground-light">Enable Index Advisor</p>
            <p className="text-center text-xs text-foreground-lighter mb-2">
              Recommends indexes to improve query performance.
            </p>
            <div className="flex items-center gap-x-2">
              <DocsButton href={`${DOCS_URL}/guides/database/extensions/index_advisor`} />
              <EnableIndexAdvisorButton />
            </div>
          </div>
        </QueryPanelSection>
      </QueryPanelContainer>
    )
  }

  return (
    <QueryPanelContainer className="h-full overflow-y-auto py-0 pt-4">
      {(columnName || suggestedSelectQuery) && (
        <QueryPanelSection className="pt-2 pb-6 border-b">
          <div className="flex flex-col gap-y-3">
            <div>
              <h4 className="mb-2">Recommendation reason</h4>
              {columnName && (
                <p className="text-sm text-foreground-light">
                  Recommendation for column: <span className="font-mono">{columnName}</span>
                </p>
              )}
            </div>
            {suggestedSelectQuery && (
              <div className="flex flex-col gap-y-4">
                <p className="text-sm text-foreground-light">Based on the following query:</p>
                <CodeBlock
                  hideLineNumbers
                  value={suggestedSelectQuery}
                  language="sql"
                  className={cn(
                    'max-w-full max-h-[200px]',
                    '!py-2 !px-2.5 prose dark:prose-dark',
                    '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap'
                  )}
                />
              </div>
            )}
          </div>
        </QueryPanelSection>
      )}
      <QueryPanelSection className="pt-2 mb-6">
        <div className="mb-4 flex flex-col gap-y-1">
          <h4 className="mb-2">Indexes in use</h4>
          <p className="text-sm text-foreground-light">
            This query is using the following index{(usedIndexes ?? []).length > 1 ? 's' : ''}:
          </p>
        </div>
        {isLoading && <GenericSkeletonLoader />}
        {isError && (
          <AlertError
            projectRef={project?.ref}
            error={error}
            subject="Failed to retrieve indexes in use"
          />
        )}
        {isSuccess && (
          <div>
            {usedIndexes.length === 0 && (
              <div className="border rounded border-dashed flex flex-col items-center justify-center py-4 px-12 gap-y-1 text-center">
                <p className="text-sm text-foreground-light">
                  No indexes are involved in this query
                </p>
                <p className="text-center text-xs text-foreground-lighter">
                  Indexes may not necessarily be used if they incur a higher cost when executing the
                  query
                </p>
              </div>
            )}
            {usedIndexes.map((index) => {
              return (
                <div
                  key={index.name}
                  className="flex items-center gap-x-4 bg-surface-100 border first:rounded-tl first:rounded-tr border-b-0 last:border-b last:rounded-b px-2 py-2"
                >
                  <div className="flex items-center gap-x-2">
                    <Table2 size={14} className="text-foreground-light" />
                    <span className="text-xs font-mono text-foreground-light">
                      {index.schema}.{index.table}
                    </span>
                  </div>
                  <span className="text-xs font-mono">{index.name}</span>
                </div>
              )
            })}
          </div>
        )}
      </QueryPanelSection>
      <QueryPanelSection className="flex flex-col gap-y-6 py-6 border-t">
        <div className="flex flex-col gap-y-1">
          {(!isSuccessIndexAdvisorResult || indexAdvisorResult !== null) && (
            <h4 className="mb-2">New index recommendations</h4>
          )}
          {isLoadingExtensions ? (
            <GenericSkeletonLoader />
          ) : !isIndexAdvisorEnabled ? (
            <IndexAdvisorDisabledState />
          ) : (
            <>
              {isLoadingIndexAdvisorResult && <GenericSkeletonLoader />}
              {isErrorIndexAdvisorResult && (
                <AlertError
                  projectRef={project?.ref}
                  error={indexAdvisorError}
                  subject="Failed to retrieve result from index advisor"
                />
              )}
              {isSuccessIndexAdvisorResult && (
                <>
                  {indexAdvisorResult === null ? (
                    <Admonition
                      type="default"
                      showIcon={true}
                      title="Index recommendations not available"
                      description="Index advisor could not analyze this query. This can happen if the query references tables, functions, or extensions that no longer exist or were deleted."
                    />
                  ) : (index_statements ?? []).length === 0 ? (
                    <Alert_Shadcn_ className="[&>svg]:rounded-full">
                      <Check />
                      <AlertTitle_Shadcn_>This query is optimized</AlertTitle_Shadcn_>
                      <AlertDescription_Shadcn_>
                        Recommendations for indexes will show here
                      </AlertDescription_Shadcn_>
                    </Alert_Shadcn_>
                  ) : (
                    <>
                      {isLinterWarning ? (
                        <Alert_Shadcn_
                          variant="default"
                          className="border-brand-400 bg-alternative [&>svg]:p-0.5 [&>svg]:bg-transparent [&>svg]:text-brand my-3"
                        >
                          <Lightbulb />
                          <AlertTitle_Shadcn_>
                            We have {index_statements.length} index recommendation
                            {index_statements.length > 1 ? 's' : ''}
                          </AlertTitle_Shadcn_>
                          <AlertDescription_Shadcn_>
                            You can improve this query's performance by{' '}
                            <span className="text-brand">{totalImprovement.toFixed(2)}%</span> by
                            adding the following suggested{' '}
                            {index_statements.length > 1 ? 'indexes' : 'index'}
                          </AlertDescription_Shadcn_>
                        </Alert_Shadcn_>
                      ) : (
                        <IndexImprovementText
                          indexStatements={index_statements}
                          totalCostBefore={total_cost_before}
                          totalCostAfter={total_cost_after}
                          className="text-sm text-foreground-light"
                        />
                      )}
                      <CodeBlock
                        hideLineNumbers
                        value={index_statements.join(';\n') + ';'}
                        language="sql"
                        className={cn(
                          'max-w-full max-h-[310px]',
                          '!py-3 !px-3.5 prose dark:prose-dark transition',
                          '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap'
                        )}
                      />
                      <p className="text-sm text-foreground-light mt-3">
                        This recommendation serves to prevent your queries from slowing down as your
                        application grows, and hence the index may not be used immediately after
                        it's created (e.g If your table is still small at this time).
                      </p>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </QueryPanelSection>
      {isIndexAdvisorEnabled && hasIndexRecommendation && (
        <>
          <QueryPanelSection className="py-6 border-t">
            <div className="flex flex-col gap-y-1">
              <h4 className="mb-2">Query costs</h4>
              <div className="border rounded-md flex flex-col bg-surface-100">
                <QueryPanelScoreSection
                  name="Total cost of query"
                  description="An estimate of how long it will take to return all the rows (Includes start up cost)"
                  before={total_cost_before}
                  after={total_cost_after}
                />
                <Collapsible_Shadcn_ open={showStartupCosts} onOpenChange={setShowStartupCosts}>
                  <CollapsibleContent_Shadcn_ asChild className="pb-3">
                    <QueryPanelScoreSection
                      hideArrowMarkers
                      className="border-t"
                      name="Start up cost"
                      description="An estimate of how long it will take to fetch the first row"
                      before={startup_cost_before}
                      after={startup_cost_after}
                    />
                  </CollapsibleContent_Shadcn_>
                  <CollapsibleTrigger_Shadcn_ className="text-xs py-1.5 border-t text-foreground-light bg-studio w-full rounded-b-md">
                    View {showStartupCosts ? 'less' : 'more'}
                  </CollapsibleTrigger_Shadcn_>
                </Collapsible_Shadcn_>
              </div>
            </div>
          </QueryPanelSection>
          <QueryPanelSection className="py-6 border-t">
            <div className="flex flex-col gap-y-2">
              <h4 className="mb-2">FAQ</h4>
              <Accordion_Shadcn_ collapsible type="single" className="border rounded-md">
                <AccordionItem_Shadcn_ value="1">
                  <AccordionTrigger className="px-4 py-3 text-sm font-normal text-foreground-light hover:text-foreground transition [&[data-state=open]]:text-foreground">
                    What units are cost in?
                  </AccordionTrigger>
                  <AccordionContent_Shadcn_ className="px-4 text-foreground-light">
                    Costs are in an arbitrary unit, and do not represent a unit of time. The units
                    are anchored (by default) to a single sequential page read costing 1.0 units.
                    They do, however, serve as a predictor of higher execution times.
                  </AccordionContent_Shadcn_>
                </AccordionItem_Shadcn_>
                <AccordionItem_Shadcn_ value="2" className="border-b-0">
                  <AccordionTrigger className="px-4 py-3 text-sm font-normal text-foreground-light hover:text-foreground transition [&[data-state=open]]:text-foreground">
                    How should I prioritize start up and total cost?
                  </AccordionTrigger>
                  <AccordionContent_Shadcn_ className="px-4 text-foreground-light [&>div]:space-y-2">
                    <p>This depends on the expected size of the result set from the query.</p>
                    <p>
                      For queries that return a small number or rows, the startup cost is more
                      critical and minimizing startup cost can lead to faster response times,
                      especially in interactive applications.
                    </p>
                    <p>
                      For queries that return a large number of rows, the total cost becomes more
                      important, and optimizing it will help in efficiently using resources and
                      reducing overall query execution time.
                    </p>
                  </AccordionContent_Shadcn_>
                </AccordionItem_Shadcn_>
              </Accordion_Shadcn_>
            </div>
          </QueryPanelSection>
        </>
      )}

      {isIndexAdvisorEnabled && hasIndexRecommendation && (
        <div className="bg-studio sticky bottom-0 border-t py-3 flex items-center justify-between px-5">
          <div className="flex flex-col gap-y-0.5 text-xs">
            <span>Apply index to database</span>
            <span className="text-xs text-foreground-light">
              This will run the SQL that is shown above
            </span>
          </div>
          <Button
            disabled={isExecuting}
            loading={isExecuting}
            type="primary"
            onClick={() => createIndex()}
          >
            Create index
          </Button>
        </div>
      )}
    </QueryPanelContainer>
  )
}
