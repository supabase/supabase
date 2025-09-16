import { Lightbulb } from 'lucide-react'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

import { formatSql } from 'lib/formatSql'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button, cn } from 'ui'
import { QueryPanelContainer, QueryPanelSection } from './QueryPanel'
import {
  QUERY_PERFORMANCE_COLUMNS,
  QUERY_PERFORMANCE_REPORT_TYPES,
} from './QueryPerformance.constants'

interface QueryDetailProps {
  reportType: QUERY_PERFORMANCE_REPORT_TYPES
  selectedRow: any
  onClickViewSuggestion: () => void
}

// Load SqlMonacoBlock (monaco editor) client-side only (does not behave well server-side)
const SqlMonacoBlock = dynamic(
  () => import('./SqlMonacoBlock').then(({ SqlMonacoBlock }) => SqlMonacoBlock),
  {
    ssr: false,
  }
)

export const QueryDetail = ({ selectedRow, onClickViewSuggestion }: QueryDetailProps) => {
  // [Joshen] TODO implement this logic once the linter rules are in
  const isLinterWarning = false
  const report = QUERY_PERFORMANCE_COLUMNS
  const [query, setQuery] = useState(selectedRow?.['query'])

  useEffect(() => {
    if (selectedRow !== undefined) {
      const formattedQuery = formatSql(selectedRow['query'])
      setQuery(formattedQuery)
    }
  }, [selectedRow])

  return (
    <QueryPanelContainer>
      <QueryPanelSection>
        <p className="text-sm">Query pattern</p>
        <SqlMonacoBlock value={query} height={310} lineNumbers="off" wrapperClassName="pl-3" />
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
            const rawValue = selectedRow?.[x.id]
            const isTime = x.name.includes('time')

            const formattedValue = isTime
              ? typeof rawValue === 'number' && !isNaN(rawValue) && isFinite(rawValue)
                ? `${rawValue.toFixed(2)}ms`
                : 'N/A'
              : rawValue != null
                ? String(rawValue)
                : 'N/A'

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
