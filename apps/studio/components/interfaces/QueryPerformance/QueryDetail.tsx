import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CodeBlock,
  cn,
} from 'ui'
import {
  QUERY_PERFORMANCE_REPORTS,
  QUERY_PERFORMANCE_REPORT_TYPES,
} from './QueryPerformance.constants'
import { format } from 'sql-formatter'
import { useEffect, useState } from 'react'
import { QueryPanelContainer, QueryPanelSection } from './QueryPanel'
import { Lightbulb } from 'lucide-react'

interface QueryDetailProps {
  reportType: QUERY_PERFORMANCE_REPORT_TYPES
  selectedRow: any
  onClickViewSuggestion: () => void
}

export const QueryDetail = ({
  reportType,
  selectedRow,
  onClickViewSuggestion,
}: QueryDetailProps) => {
  // [Joshen] TODO implement this logic once the linter rules are in
  const isLinterWarning = false
  const report = QUERY_PERFORMANCE_REPORTS[reportType]
  const [query, setQuery] = useState(selectedRow?.['query'])

  useEffect(() => {
    if (selectedRow !== undefined) {
      try {
        const formattedQuery = format(selectedRow['query'], {
          language: 'postgresql',
          keywordCase: 'lower',
        })
        setQuery(formattedQuery)
      } catch (err) {
        setQuery(selectedRow['query'])
      }
    }
  }, [selectedRow])

  return (
    <QueryPanelContainer>
      <QueryPanelSection>
        <p className="text-sm">Query pattern</p>
        <CodeBlock
          hideLineNumbers
          value={query}
          language="sql"
          className={cn(
            'max-w-full max-h-[310px]',
            '!py-3 !px-3.5 prose dark:prose-dark transition',
            '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap'
          )}
        />
        {isLinterWarning && (
          <Alert_Shadcn_
            variant="default"
            className="mt-2 border-brand-400 bg-alternative [&>svg]:p-0.5 [&>svg]:bg-transparent [&>svg]:text-brand"
          >
            <Lightbulb />
            <AlertTitle_Shadcn_>Suggested optimization: Add an index</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Adding an index will help this query execute faster
            </AlertDescription_Shadcn_>
            <AlertDescription_Shadcn_>
              <Button className="mt-3" onClick={() => onClickViewSuggestion()}>
                View suggestion
              </Button>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        )}
      </QueryPanelSection>
      <div className="border-t" />
      <QueryPanelSection className="gap-y-1">
        {report
          .filter((x) => x.id !== 'query')
          .map((x) => {
            const isTime = x.name.includes('time')
            const formattedValue = isTime
              ? `${selectedRow?.[x.id].toFixed(2)}ms`
              : String(selectedRow?.[x.id])
            return (
              <div key={x.id} className="flex gap-x-2">
                <p className="text-foreground-lighter text-sm w-32">{x.name}</p>
                <p className="text-sm w-32">{formattedValue}</p>
              </div>
            )
          })}
      </QueryPanelSection>
    </QueryPanelContainer>
  )
}
