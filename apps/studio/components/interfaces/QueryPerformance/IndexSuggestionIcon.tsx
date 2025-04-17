import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  WarningIcon,
  cn,
  CodeBlock,
  Separator,
} from 'ui'
import { QueryPanelScoreSection } from './QueryPanel'

interface IndexSuggestionIconProps {
  indexAdvisorResult: {
    has_suggestion: boolean
    startup_cost_before: number
    startup_cost_after: number
    total_cost_before: number
    total_cost_after: number
    index_statements: string[]
  }
  query: string
}

export const IndexSuggestionIcon = ({ indexAdvisorResult, query }: IndexSuggestionIconProps) => {
  if (!indexAdvisorResult?.has_suggestion) return null

  const totalImprovement =
    ((indexAdvisorResult.total_cost_before - indexAdvisorResult.total_cost_after) /
      indexAdvisorResult.total_cost_before) *
    100

  return (
    <HoverCard>
      <HoverCardTrigger>
        <WarningIcon />
      </HoverCardTrigger>
      <HoverCardContent className="w-[520px] p-0 overflow-hidden" align="start" alignOffset={-32}>
        <div className="px-4 py-3 bg-surface-75">
          <p className="text-sm">
            Creating the following index can improve this query's performance by{' '}
            <span className="text-brand">{totalImprovement.toFixed(2)}%</span>:
          </p>
        </div>
        <Separator />
        <div>
          <CodeBlock
            hideLineNumbers
            value={indexAdvisorResult.index_statements[0]}
            language="sql"
            className={cn(
              'border-none rounded-none',
              'max-w-full',
              '!py-0.5 !px-3.5 prose dark:prose-dark transition',
              '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap'
            )}
          />
        </div>
        <Separator />
        <QueryPanelScoreSection
          name="Total cost of query"
          description="An estimate of how long it will take to return all the rows (Includes start up cost)"
          before={indexAdvisorResult.total_cost_before}
          after={indexAdvisorResult.total_cost_after}
        />
        <QueryPanelScoreSection
          hideArrowMarkers
          className="border-t"
          name="Start up cost"
          description="An estimate of how long it will take to fetch the first row"
          before={indexAdvisorResult.startup_cost_before}
          after={indexAdvisorResult.startup_cost_after}
        />
      </HoverCardContent>
    </HoverCard>
  )
}
