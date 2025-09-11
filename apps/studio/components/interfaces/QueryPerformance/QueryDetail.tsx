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

const QueryPlanVisualizer = dynamic(
  () =>
    import('components/ui/QueryPlan/query-plan-visualizer').then(
      ({ QueryPlanVisualizer }) => QueryPlanVisualizer
    ),
  { ssr: false }
)

export const QueryDetail = ({ selectedRow, onClickViewSuggestion }: QueryDetailProps) => {
  // [Joshen] TODO implement this logic once the linter rules are in
  const isLinterWarning = false
  const report = QUERY_PERFORMANCE_COLUMNS
  const [query, setQuery] = useState(selectedRow?.['query'])
  // Temporary: reuse the sample EXPLAIN JSON from project/[ref]/index.tsx
  // This will be wired to real EXPLAIN output from pg_analyze subsequently.
  const sampleExplainJson = `[
   {
      "Plan":{
         "Node Type":"Hash Join",
         "Join Type":"Inner",
         "Startup Cost":10.00,
         "Total Cost":120.00,
         "Plan Rows":500,
         "Plan Width":64,
         "Actual Startup Time":0.20,
         "Actual Total Time":20.00,
         "Actual Rows":400,
         "Actual Loops":1,
         "Parallel Aware":true,
         "Workers Planned":4,
         "Workers Launched":3,
         "Hash Cond":"(t1.id = t2.id)",
         "Rows Removed by Join Filter":50,
         "Group Key":[
            "t1.category"
         ],
         "Sort Key":[
            "(t1.created_at)",
            "t2.name"
         ],
         "Presorted Key":[
            "(t1.created_at)"
         ],
         "Plans":[
            {
               "Node Type":"Seq Scan",
               "Relation Name":"table2",
               "Alias":"t2",
               "Startup Cost":0.00,
               "Total Cost":50.00,
               "Plan Rows":2000,
               "Plan Width":32,
               "Actual Startup Time":0.00,
               "Actual Total Time":8.00,
               "Actual Rows":150,
               "Actual Loops":1,
               "Rows Removed by Filter":20
            },
            {
               "Node Type":"Bitmap Heap Scan",
               "Relation Name":"table1",
               "Alias":"t1",
               "Startup Cost":0.00,
               "Total Cost":70.00,
               "Plan Rows":100,
               "Plan Width":32,
               "Actual Startup Time":0.10,
               "Actual Total Time":12.00,
               "Actual Rows":900,
               "Actual Loops":1,
               "Rows Removed by Index Recheck":10,
               "Recheck Cond":"(id < 1000)",
               "Plans":[
                  {
                     "Node Type":"Bitmap Index Scan",
                     "Index Name":"idx_t1_id",
                     "Startup Cost":0.00,
                     "Total Cost":10.00,
                     "Plan Rows":100,
                     "Plan Width":0,
                     "Actual Startup Time":0.00,
                     "Actual Total Time":1.50,
                     "Actual Rows":120,
                     "Actual Loops":0,
                     "Index Cond":"(id < 1000)"
                  }
               ]
            }
         ]
      },
      "Planning Time":0.80,
      "Execution Time":22.50
   }
 ]`

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
      <div className="border-t" />
      <QueryPanelSection>
        <p className="text-sm">Execution plan</p>
        <div className="h-[420px]">
          <QueryPlanVisualizer json={sampleExplainJson} />
        </div>
      </QueryPanelSection>
    </QueryPanelContainer>
  )
}
