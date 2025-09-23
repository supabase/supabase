import { Lightbulb, ChevronsUpDown, Expand } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import dayjs from 'dayjs'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { formatSql } from 'lib/formatSql'
import {
  AiIconAnimation,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  cn,
  markdownComponents,
} from 'ui'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { QueryPanelContainer, QueryPanelSection } from './QueryPanel'
import {
  QUERY_PERFORMANCE_COLUMNS,
  QUERY_PERFORMANCE_REPORT_TYPES,
} from './QueryPerformance.constants'
import { executeSql } from 'data/sql/execute-sql-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { analyzeSqlExplain } from 'data/ai/sql-explain-mutation'
// Avoid importing MessageMarkdown components to prevent circular deps

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

  const [isExpanded, setIsExpanded] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisText, setAnalysisText] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false)

  const { data: project } = useSelectedProjectQuery()
  const dbSelector = useDatabaseSelectorStateSnapshot()
  const { data: databases } = useReadReplicasQuery({ projectRef: project?.ref })
  const connectionString = (databases || []).find(
    (db) => db.identifier === dbSelector.selectedDatabaseId
  )?.connectionString

  // Heuristics to support EXPLAIN for parameterized queries taken from common patterns.
  // If we cannot confidently infer a type, we default to text with safe placeholder values.
  const extractParameterIndexes = (sql: string): number[] => {
    const indexes = new Set<number>()
    const regex = /\$(\d+)/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(sql)) !== null) {
      const idx = Number(match[1])
      if (!isNaN(idx)) indexes.add(idx)
    }
    return Array.from(indexes).sort((a, b) => a - b)
  }

  const sqlQuoteLiteral = (val: string) => `'${val.replace(/'/g, "''")}'`

  const inferParamBinding = (sql: string, index: number): { pgType: string; valueSql: string } => {
    const i = index
    const likeCtx = new RegExp(`\\b(?:ilike|like)\\s*\\$${i}\\b`, 'i')
    const limitCtx = new RegExp(`\\blimit\\s*\\$${i}\\b`, 'i')
    const sleepCtx = new RegExp(`pg_sleep\\s*\\(\\s*\\$${i}\\s*\\)`, 'i')
    const toCharCtx = new RegExp(`to_char\\s*\\([^)]*?\\$${i}[^)]*?\\)`, 'i')
    const jsonKeyCtx = new RegExp(`->>\\s*\\$${i}`, 'i')
    const boolCtx = new RegExp(`\\b(?:on|where)\\s*\\$${i}\\b`, 'i')

    if (sleepCtx.test(sql)) {
      return { pgType: 'double precision', valueSql: '0' }
    }
    if (limitCtx.test(sql)) {
      // Small limit to keep ANALYZE fast, but non-zero to keep plan shape reasonable
      return { pgType: 'int', valueSql: '100' }
    }
    if (likeCtx.test(sql)) {
      return { pgType: 'text', valueSql: sqlQuoteLiteral('%%') }
    }
    if (toCharCtx.test(sql)) {
      return { pgType: 'text', valueSql: sqlQuoteLiteral('YYYY-MM-DD') }
    }
    if (jsonKeyCtx.test(sql)) {
      return { pgType: 'text', valueSql: sqlQuoteLiteral('key') }
    }
    if (boolCtx.test(sql)) {
      return { pgType: 'boolean', valueSql: 'true' }
    }

    // Equality or catch-all: default to text
    return { pgType: 'text', valueSql: sqlQuoteLiteral('value') }
  }

  const runExplainAnalyze = useCallback(async () => {
    if (!query) return
    setIsAnalyzing(true)
    setAnalysisError(null)
    setAnalysisText(null)

    try {
      const originalQuery = query as string

      // Detect parameters like $1, $2 ... and build a PREPARE/EXECUTE EXPLAIN if present
      const params = extractParameterIndexes(originalQuery)

      let explainSql: string
      if (params.length === 0) {
        explainSql =
          `BEGIN;\n` +
          `EXPLAIN (ANALYZE, BUFFERS, VERBOSE, WAL, SETTINGS, FORMAT JSON) ${originalQuery};\n` +
          `ROLLBACK;`
      } else {
        // Generic plan path inspired by PREPARE with unknown + NULLs
        const maxParam = Math.max(...params)
        const unknowns = Array(maxParam).fill('unknown').join(', ')
        const nulls = Array(maxParam).fill('NULL').join(', ')
        const stmtName = '__qp_stmt__'
        explainSql =
          `BEGIN;\n` +
          `SET LOCAL plan_cache_mode = force_generic_plan;\n` +
          `PREPARE ${stmtName}(${unknowns}) AS ${originalQuery};\n` +
          `EXPLAIN (VERBOSE, SETTINGS, FORMAT JSON) EXECUTE ${stmtName}(${nulls});\n` +
          `DEALLOCATE ${stmtName};\n` +
          `ROLLBACK;`
      }

      let result: any[]
      try {
        const exec = await executeSql<any[]>({
          projectRef: project?.ref,
          connectionString: connectionString || project?.connectionString,
          sql: explainSql,
        })
        result = exec.result
      } catch (err: any) {
        throw err
      }

      const text: string = await analyzeSqlExplain({
        plan: JSON.stringify(result),
        query: originalQuery,
      })
      console.log('text', text)
      setAnalysisText(text)
      setIsAnalysisExpanded(false)
    } catch (e: any) {
      const message =
        typeof e?.message === 'string' ? e.message : 'Unexpected error while analyzing the query'
      // Provide a clearer hint for parameter binding issues
      const hint = /parameter|\$\d+/.test(message.toLowerCase())
        ? ' This query appears to be parameterized. We attempted to bind safe defaults. You can refine the plan by providing representative values in the SQL.'
        : ''
      setAnalysisError(message + hint)
    } finally {
      setIsAnalyzing(false)
    }
  }, [project?.ref, connectionString, project?.connectionString, query])

  // Use shared markdownComponents from ui to render analysis

  const formatDuration = (seconds: number) => {
    const dur = dayjs.duration(seconds, 'seconds')

    const minutes = Math.floor(dur.asMinutes())
    const remainingSeconds = dur.seconds() + dur.milliseconds() / 1000

    const parts = []
    if (minutes > 0) parts.push(`${minutes}m`)
    if (remainingSeconds > 0) {
      const formattedSeconds = remainingSeconds.toFixed(2)
      parts.push(`${formattedSeconds}s`)
    }

    return parts.join(' ')
  }

  return (
    <QueryPanelContainer>
      <QueryPanelSection className="pt-2 border-b relative">
        <h4 className="mb-4">Query pattern</h4>
        <div
          className={cn(
            'overflow-hidden pb-0 z-0 relative transition-all duration-300',
            isExpanded ? 'h-[348px]' : 'h-[120px]'
          )}
        >
          <SqlMonacoBlock
            value={query}
            height={322}
            lineNumbers="off"
            wrapperClassName={cn('pl-3 bg-surface-100', !isExpanded && 'pointer-events-none')}
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
        </div>
        <div
          className={cn(
            'absolute left-0 bottom-0 w-full bg-gradient-to-t from-black/30 to-transparent h-24 transition-opacity duration-300',
            isExpanded && 'opacity-0 pointer-events-none'
          )}
        />
        <div className="absolute -bottom-[13px] left-0 right-0 w-full flex items-center justify-center z-10">
          <Button
            type="default"
            className="rounded-full"
            icon={<ChevronsUpDown />}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </QueryPanelSection>
      <QueryPanelSection className="py-6">
        <h4 className="mb-2">Metadata</h4>
        <ul className="flex flex-col gap-y-3 divide-y divide-dashed">
          {report
            .filter((x) => x.id !== 'query')
            .map((x) => {
              const rawValue = selectedRow?.[x.id]
              const isTime = x.name.includes('time')

              const formattedValue = isTime
                ? typeof rawValue === 'number' && !isNaN(rawValue) && isFinite(rawValue)
                  ? `${Math.round(rawValue).toLocaleString()}ms`
                  : 'n/a'
                : rawValue != null
                  ? String(rawValue)
                  : 'n/a'

              if (x.id === 'prop_total_time') {
                const percentage = selectedRow?.prop_total_time || 0
                const totalTime = selectedRow?.total_time || 0

                return (
                  <li key={x.id} className="flex justify-between pt-3 text-sm">
                    <p className="text-foreground-light">{x.name}</p>
                    {percentage && totalTime ? (
                      <p className="flex items-center gap-x-1.5">
                        <span
                          className={cn(
                            'tabular-nums',
                            percentage.toFixed(1) === '0.0' && 'text-foreground-lighter'
                          )}
                        >
                          {percentage.toFixed(1)}%
                        </span>{' '}
                        <span className="text-muted">/</span>{' '}
                        <span
                          className={cn(
                            'tabular-nums',
                            formatDuration(rawValue / 1000) === '0.00s' && 'text-foreground-lighter'
                          )}
                        >
                          {formatDuration(totalTime / 1000)}
                        </span>
                      </p>
                    ) : (
                      <p className="text-muted">&ndash;</p>
                    )}
                  </li>
                )
              }

              if (x.id == 'rows_read') {
                return (
                  <li key={x.id} className="flex justify-between pt-3 text-sm">
                    <p className="text-foreground-light">{x.name}</p>
                    {typeof rawValue === 'number' && !isNaN(rawValue) && isFinite(rawValue) ? (
                      <p
                        className={cn('tabular-nums', rawValue === 0 && 'text-foreground-lighter')}
                      >
                        {rawValue.toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-muted">&ndash;</p>
                    )}
                  </li>
                )
              }

              const cacheHitRateToNumber = (value: number | string) => {
                if (typeof value === 'number') return value
                return parseFloat(value.toString().replace('%', '')) || 0
              }

              if (x.id === 'cache_hit_rate') {
                return (
                  <li key={x.id} className="flex justify-between pt-3 text-sm">
                    <p className="text-foreground-light">{x.name}</p>
                    {typeof rawValue === 'string' ? (
                      <p
                        className={cn(
                          cacheHitRateToNumber(rawValue).toFixed(2) === '0.00' &&
                            'text-foreground-lighter'
                        )}
                      >
                        {cacheHitRateToNumber(rawValue).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        %
                      </p>
                    ) : (
                      <p className="text-muted">&ndash;</p>
                    )}
                  </li>
                )
              }

              return (
                <li key={x.id} className="flex justify-between pt-3 text-sm">
                  <p className="text-foreground-light">{x.name}</p>
                  <p className={cn('tabular-nums', x.id === 'rolname' && 'font-mono')}>
                    {formattedValue}
                  </p>
                </li>
              )
            })}
        </ul>
      </QueryPanelSection>
      <QueryPanelSection className="py-6 border-t">
        <h4 className="mb-4">Analysis</h4>
        {!analysisText && (
          <Button
            type="default"
            loading={isAnalyzing}
            onClick={runExplainAnalyze}
            icon={<AiIconAnimation />}
          >
            Analyze this query
          </Button>
        )}
        {analysisError && <p className="mt-3 text-destructive text-sm">{analysisError}</p>}
        {analysisText && (
          <div className="mt-4 relative">
            <div
              className={cn(
                'overflow-hidden pb-0 z-0 relative transition-all duration-300 rounded-md border bg-surface-100 p-4',
                isAnalysisExpanded ? 'h-fit' : 'h-[160px]'
              )}
            >
              <div className="px-3 py-3">
                <ReactMarkdown
                  className={cn(
                    'max-w-none prose prose-sm break-words [&>div]:my-4 prose-h1:text-xl prose-h1:mt-6 prose-h2:text-lg prose-h3:no-underline prose-h3:text-base prose-h3:mb-4 prose-strong:font-medium prose-strong:text-foreground prose-ol:space-y-3 prose-ul:space-y-3 prose-li:my-0'
                  )}
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {analysisText}
                </ReactMarkdown>
              </div>
              <div
                className={cn(
                  'absolute left-0 bottom-0 w-full bg-gradient-to-t from-black/30 to-transparent h-24 transition-opacity duration-300',
                  isAnalysisExpanded && 'opacity-0 pointer-events-none'
                )}
              />
            </div>
            <div className="absolute -bottom-[13px] left-0 right-0 w-full flex items-center justify-center z-10">
              <Button
                type="default"
                className="rounded-full"
                icon={<ChevronsUpDown />}
                onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
              >
                {isAnalysisExpanded ? 'Collapse' : 'Expand'}
              </Button>
            </div>
          </div>
        )}
      </QueryPanelSection>
    </QueryPanelContainer>
  )
}
