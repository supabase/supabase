import { Check, Lightbulb, Table2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { AccordionTrigger } from '@ui/components/shadcn/ui/accordion'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useGetIndexAdvisorResult } from 'data/database/retrieve-index-advisor-result-query'
import { useGetIndexesFromSelectQuery } from 'data/database/retrieve-index-from-select-query'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
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
import { GenericSkeletonLoader } from 'ui-patterns'
import { IndexAdvisorDisabledState } from './IndexAdvisorDisabledState'
import { QueryPanelContainer, QueryPanelScoreSection, QueryPanelSection } from './QueryPanel'

interface QueryIndexesProps {
  selectedRow: any
}

// [Joshen] There's several more UX things we can do to help ease the learning curve of indexes I think
// e.g understanding "costs", what numbers of "costs" are actually considered insignificant

export const QueryIndexes = ({ selectedRow }: QueryIndexesProps) => {
  // [Joshen] TODO implement this logic once the linter rules are in
  const isLinterWarning = false
  const { project } = useProjectContext()
  const [showStartupCosts, setShowStartupCosts] = useState(false)

  const {
    data: usedIndexes,
    isSuccess,
    isLoading,
  } = useGetIndexesFromSelectQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    query: selectedRow?.['query'],
  })

  const { data: extensions, isLoading: isLoadingExtensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const hypopgExtension = (extensions ?? []).find((ext) => ext.name === 'hypopg')
  const indexAdvisorExtension = (extensions ?? []).find((ext) => ext.name === 'index_advisor')
  const isIndexAdvisorAvailable =
    indexAdvisorExtension !== undefined &&
    indexAdvisorExtension.installed_version !== null &&
    hypopgExtension !== undefined &&
    hypopgExtension.installed_version !== null

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
    { enabled: isIndexAdvisorAvailable }
  )

  const {
    index_statements,
    startup_cost_after,
    startup_cost_before,
    total_cost_after,
    total_cost_before,
  } = indexAdvisorResult ?? { index_statements: [], total_cost_after: 0, total_cost_before: 0 }
  const hasIndexRecommendation = isSuccessIndexAdvisorResult && index_statements.length > 0
  const totalImprovement = isSuccessIndexAdvisorResult
    ? ((total_cost_before - total_cost_after) / total_cost_before) * 100
    : 0

  const { mutate: execute, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: async () => {
      await refetch()
      toast.success(`Successfully created index`)
    },
    onError: (error) => {
      toast.error(`Failed to create index: ${error.message}`)
    },
  })

  const createIndex = () => {
    if (index_statements.length === 0) return

    execute({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      sql: index_statements.join(';\n') + ';',
    })
  }

  return (
    <QueryPanelContainer className="h-full">
      <QueryPanelSection>
        <div>
          <p className="text-sm">Indexes in use</p>
          <p className="text-sm text-foreground-light">
            This query is using the following index{(usedIndexes ?? []).length > 1 ? 's' : ''}:
          </p>
        </div>
        {isLoading && <GenericSkeletonLoader />}
        {isSuccess && (
          <div>
            {usedIndexes.length === 0 && (
              <div className="border rounded border-dashed flex flex-col items-center justify-center py-4 px-20 gap-y-1">
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

      <div className="border-t" />

      <QueryPanelSection className="flex flex-col gap-y-6">
        <div className="flex flex-col gap-y-2">
          <p className="text-sm">New index recommendations</p>
          {isLoadingExtensions ? (
            <GenericSkeletonLoader />
          ) : !isIndexAdvisorAvailable ? (
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
                  {(index_statements ?? []).length === 0 ? (
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
                          className="border-brand-400 bg-alternative [&>svg]:p-0.5 [&>svg]:bg-transparent [&>svg]:text-brand"
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
                        <p className="text-sm text-foreground-light">
                          Creating the following {index_statements.length > 1 ? 'indexes' : 'index'}{' '}
                          on <code className="text-xs">public.files</code> can improve this query's
                          performance by{' '}
                          <span className="text-brand">{totalImprovement.toFixed(2)}%</span>:
                        </p>
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
                      <p className="text-sm text-foreground-light">
                        This recommendation serves to prevent your queries from slowing down as your
                        application grows, and hence the index may not be used immediately after
                        it's created. (e.g If your table is still small at this time)
                      </p>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
        {isIndexAdvisorAvailable && hasIndexRecommendation && (
          <>
            <div className="flex flex-col gap-y-2">
              <p className="text-sm">Query costs</p>
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
            <div className="flex flex-col gap-y-2">
              <p className="text-sm">FAQ</p>
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
          </>
        )}
      </QueryPanelSection>

      {isIndexAdvisorAvailable && hasIndexRecommendation && (
        <div className="bg-studio sticky bottom-0 border-t py-3 flex items-center justify-between px-5">
          <div className="flex flex-col gap-y-1 text-sm">
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
