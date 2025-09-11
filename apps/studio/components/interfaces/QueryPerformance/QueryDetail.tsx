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
    "Plan": {
      "Node Type": "Hash Join",
      "Join Type": "Inner",
      "Startup Cost": 230.47,
      "Total Cost": 713.98,
      "Plan Rows": 101,
      "Plan Width": 488,
      "Actual Startup Time": 0.15,
      "Actual Total Time": 22.0,
      "Actual Rows": 95,
      "Actual Loops": 1,
      "Parallel Aware": true,
      "Async Capable": true,
      "Workers Planned": 4,
      "Workers Launched": 3,
      "Hash Cond": "(t1.id = t2.id)",
      "Join Filter": "(t1.flag = true)",
      "Rows Removed by Join Filter": 5,
      "Group Key": ["t1.category"],
      "Sort Key": ["(t1.created_at)", "t2.name"],
      "Presorted Key": ["(t1.created_at)"],
      "Shared Hit Blocks": 30,
      "Shared Read Blocks": 10,
      "Shared Dirtied Blocks": 3,
      "Shared Written Blocks": 1,
      "Local Hit Blocks": 2,
      "Local Read Blocks": 1,
      "Local Dirtied Blocks": 0,
      "Local Written Blocks": 0,
      "Temp Read Blocks": 8,
      "Temp Written Blocks": 2,
      "I/O Read Time": 1.7,
      "I/O Write Time": 0.8,
      "Output": ["t1.id", "t2.name", "t1.created_at", "t1.category"],
      "Plans": [
        {
          "Node Type": "Sort",
          "Startup Cost": 50.0,
          "Total Cost": 60.0,
          "Plan Rows": 2000,
          "Plan Width": 64,
          "Actual Startup Time": 0.05,
          "Actual Total Time": 8.0,
          "Actual Rows": 150,
          "Actual Loops": 1,
          "Sort Method": "quicksort",
          "Sort Space Used": 2048,
          "Sort Space Type": "Memory",
          "Shared Hit Blocks": 8,
          "Shared Read Blocks": 1,
          "Shared Dirtied Blocks": 0,
          "Shared Written Blocks": 0,
          "Local Hit Blocks": 0,
          "Local Read Blocks": 0,
          "Local Dirtied Blocks": 0,
          "Local Written Blocks": 0,
          "Temp Read Blocks": 2,
          "Temp Written Blocks": 1,
          "Output": ["t2.id", "t2.name"],
          "Plans": [
            {
              "Node Type": "Seq Scan",
              "Relation Name": "table2",
              "Alias": "t2",
              "Startup Cost": 0.0,
              "Total Cost": 50.0,
              "Plan Rows": 2000,
              "Plan Width": 32,
              "Actual Startup Time": 0.0,
              "Actual Total Time": 7.5,
              "Actual Rows": 150,
              "Actual Loops": 1,
              "Rows Removed by Filter": 20,
              "Filter": "(status = 'active')",
              "Heap Fetches": 12,
              "Shared Hit Blocks": 5,
              "Shared Read Blocks": 1,
              "Shared Dirtied Blocks": 0,
              "Shared Written Blocks": 0,
              "Local Hit Blocks": 0,
              "Local Read Blocks": 0,
              "Local Dirtied Blocks": 0,
              "Local Written Blocks": 0,
              "Temp Read Blocks": 0,
              "Temp Written Blocks": 0,
              "I/O Read Time": 0.6,
              "Output": ["t2.id", "t2.name", "t2.status"]
            }
          ]
        },
        {
          "Node Type": "Bitmap Heap Scan",
          "Relation Name": "table1",
          "Alias": "t1",
          "Startup Cost": 230.47,
          "Total Cost": 268.49,
          "Plan Rows": 101,
          "Plan Width": 244,
          "Actual Startup Time": 0.1,
          "Actual Total Time": 12.0,
          "Actual Rows": 900,
          "Actual Loops": 1,
          "Rows Removed by Index Recheck": 10,
          "Recheck Cond": "(id < 1000)",
          "Heap Fetches": 42,
          "Shared Hit Blocks": 12,
          "Shared Read Blocks": 4,
          "Shared Dirtied Blocks": 1,
          "Shared Written Blocks": 0,
          "Local Hit Blocks": 1,
          "Local Read Blocks": 0,
          "Local Dirtied Blocks": 0,
          "Local Written Blocks": 0,
          "Temp Read Blocks": 3,
          "Temp Written Blocks": 1,
          "I/O Read Time": 0.7,
          "I/O Write Time": 0.2,
          "Output": ["t1.id", "t1.created_at", "t1.category"],
          "Plans": [
            {
              "Node Type": "Bitmap Index Scan",
              "Index Name": "idx_t1_id",
              "Startup Cost": 0.0,
              "Total Cost": 10.0,
              "Plan Rows": 100,
              "Plan Width": 0,
              "Actual Startup Time": 0.0,
              "Actual Total Time": 1.5,
              "Actual Rows": 120,
              "Actual Loops": 0,
              "Index Cond": "(id < 1000)",
              "Shared Hit Blocks": 2,
              "Shared Read Blocks": 1,
              "Shared Dirtied Blocks": 0,
              "Shared Written Blocks": 0,
              "Local Hit Blocks": 0,
              "Local Read Blocks": 0,
              "Local Dirtied Blocks": 0,
              "Local Written Blocks": 0,
              "Temp Read Blocks": 1,
              "Temp Written Blocks": 0,
              "Subplan Name": "SubPlan 1",
              "Output": ["t1.id"]
            }
          ]
        },
        {
          "Node Type": "Result",
          "Subplan Name": "CTE recent_msgs",
          "Startup Cost": 0.0,
          "Total Cost": 20.0,
          "Plan Rows": 50,
          "Plan Width": 32,
          "Actual Startup Time": 0.0,
          "Actual Total Time": 2.5,
          "Actual Rows": 50,
          "Actual Loops": 1,
          "Shared Hit Blocks": 4,
          "Shared Read Blocks": 0,
          "Shared Dirtied Blocks": 0,
          "Shared Written Blocks": 0,
          "Local Hit Blocks": 0,
          "Local Read Blocks": 0,
          "Local Dirtied Blocks": 0,
          "Local Written Blocks": 0,
          "Temp Read Blocks": 1,
          "Temp Written Blocks": 0,
          "Output": ["recent_msgs.message_id", "recent_msgs.thread_id"],
          "Plans": [
            {
              "Node Type": "CTE Scan",
              "CTE Name": "recent_msgs",
              "Plan Rows": 50,
              "Plan Width": 32,
              "Actual Startup Time": 0.0,
              "Actual Total Time": 2.5,
              "Actual Rows": 50,
              "Actual Loops": 1,
              "Shared Hit Blocks": 2,
              "Shared Read Blocks": 0,
              "Shared Dirtied Blocks": 0,
              "Shared Written Blocks": 0,
              "Output": ["message_id", "thread_id"]
            }
          ]
        }
      ]
    },
    "Planning Time": 0.8,
    "Execution Time": 22.5,
    "JIT": { "Timing": { "Total": 5.6 } }
  }
]
`

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
