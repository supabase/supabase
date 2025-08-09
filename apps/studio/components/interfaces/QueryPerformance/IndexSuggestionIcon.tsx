import { Loader2 } from 'lucide-react'
import { MouseEvent, useState } from 'react'

import { GetIndexAdvisorResultResponse } from 'data/database/retrieve-index-advisor-result-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  Button,
  cn,
  CodeBlock,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Separator,
  WarningIcon,
} from 'ui'
import { IndexImprovementText } from './IndexImprovementText'
import { QueryPanelScoreSection } from './QueryPanel'
import { useIndexInvalidation } from './hooks/useIndexInvalidation'
import { createIndexes } from './index-advisor.utils'

interface IndexSuggestionIconProps {
  indexAdvisorResult: GetIndexAdvisorResultResponse
  onClickIcon?: () => void
}

export const IndexSuggestionIcon = ({
  indexAdvisorResult,
  onClickIcon,
}: IndexSuggestionIconProps) => {
  const { data: project } = useSelectedProjectQuery()
  const [isCreatingIndex, setIsCreatingIndex] = useState(false)
  const [isHoverCardOpen, setIsHoverCardOpen] = useState(false)

  const invalidateQueries = useIndexInvalidation()

  const handleCreateIndex = async (e: MouseEvent) => {
    e.stopPropagation()

    setIsCreatingIndex(true)

    try {
      await createIndexes({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        indexStatements: indexAdvisorResult.index_statements,
        onSuccess: () => {
          // Handle UI-specific logic
          if (onClickIcon) {
            onClickIcon()
            setIsHoverCardOpen(false)
          }
        },
      })

      // Only invalidate queries if index creation was successful
      invalidateQueries()
    } catch (error) {
      // Error is already handled by createIndexes with a toast notification
      // But we could add component-specific error handling here if needed
      console.error('Failed to create index:', error)
      setIsCreatingIndex(false)
    } finally {
      // Reset the loading state after a short delay to show feedback
      setTimeout(() => setIsCreatingIndex(false), 1000)
    }
  }

  if (!indexAdvisorResult?.index_statements?.length) return null

  return (
    <HoverCard open={isHoverCardOpen} onOpenChange={setIsHoverCardOpen}>
      <HoverCardTrigger>
        <div
          onClick={(e) => {
            if (onClickIcon && !isCreatingIndex) {
              e.stopPropagation()
              onClickIcon()
            }
          }}
          className="cursor-pointer"
        >
          {isCreatingIndex ? (
            <Loader2 size={16} className="animate-spin text-foreground-light" />
          ) : (
            <WarningIcon />
          )}
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-[520px] p-0 overflow-hidden" align="start" alignOffset={-32}>
        <div className="px-4 py-3 bg-surface-75">
          <IndexImprovementText
            indexStatements={indexAdvisorResult.index_statements}
            totalCostBefore={indexAdvisorResult.total_cost_before}
            totalCostAfter={indexAdvisorResult.total_cost_after}
            className="text-sm"
          />
        </div>
        <Separator />
        <div>
          <CodeBlock
            hideLineNumbers
            value={indexAdvisorResult.index_statements.join(';\n') + ';'}
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
        <div className="p-3 flex gap-2 items-center border-t justify-end">
          <Button
            type="text"
            onClick={(e) => {
              e.stopPropagation()
              if (onClickIcon && !isCreatingIndex) onClickIcon()
              setIsHoverCardOpen(false)
            }}
            disabled={isCreatingIndex}
          >
            View details
          </Button>
          <Button onClick={handleCreateIndex} loading={isCreatingIndex} disabled={isCreatingIndex}>
            Create index
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
