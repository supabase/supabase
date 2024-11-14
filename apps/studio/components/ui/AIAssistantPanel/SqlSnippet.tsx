import { useState, useEffect, useCallback } from 'react'
import { Code, Play, Edit, DatabaseIcon, FileWarning } from 'lucide-react'
import { Button, CodeBlock, cn } from 'ui'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { suffixWithLimit } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import Results from 'components/interfaces/SQLEditor/UtilityPanel/Results'
import { BarChart, Bar, XAxis, CartesianGrid } from 'recharts'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from 'ui'
import { Admonition } from 'ui-patterns'
import useNewQuery from 'components/interfaces/SQLEditor/hooks'

interface SqlSnippetWrapperProps {
  sql: string
  isLoading?: boolean
  readOnly?: boolean
}

interface ParsedSqlProps {
  sql: string
  props: any
  title: string
  readOnly?: boolean
}

const isReadOnlySelect = (query: string): boolean => {
  const normalizedQuery = query.trim().toLowerCase()

  // Check if it starts with SELECT
  if (!normalizedQuery.startsWith('select')) {
    return false
  }

  // List of keywords that indicate write operations or function calls
  const disallowedPatterns = [
    // Write operations
    'insert',
    'update',
    'delete',
    'alter',
    'drop',
    'create',
    'truncate',
    'replace',
    'with',

    // Function patterns
    'function',
    'procedure',
  ]

  const allowedPatterns = ['inserted']

  // Check if query contains any disallowed patterns, but allow if part of allowedPatterns
  return !disallowedPatterns.some((pattern) => {
    // Check if the found disallowed pattern is actually part of an allowed pattern
    const isPartOfAllowedPattern = allowedPatterns.some(
      (allowed) => normalizedQuery.includes(allowed) && allowed.includes(pattern)
    )

    if (isPartOfAllowedPattern) {
      return false
    }

    return normalizedQuery.includes(pattern)
  })
}

const SqlSnippetWrapper = ({ sql, isLoading, readOnly = false }: SqlSnippetWrapperProps) => {
  let formatted = (sql || [''])[0]
  const propsMatch = formatted.match(/--\s*props:\s*(\{[^}]+\})/)
  const props = propsMatch ? JSON.parse(propsMatch[1]) : {}
  const title = props.title || 'SQL Query'
  formatted = formatted.replace(/--\s*props:\s*\{[^}]+\}/, '').trim()
  console.log('props:', propsMatch, title, propsMatch)

  return (
    <div className="-mx-8 my-3 mt-2 border-b overflow-hidden">
      <SqlCard
        sql={formatted}
        isChart={props.isChart}
        xAxis={props.xAxis}
        yAxis={props.yAxis}
        title={title}
        readOnly={readOnly}
      />
    </div>
  )
}

export const SqlCard = ({
  sql,
  isChart,
  xAxis,
  yAxis,
  title,
  readOnly = false,
}: ParsedSqlProps) => {
  const [showCode, setShowCode] = useState(readOnly || !isReadOnlySelect(sql))
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any[]>()
  const project = useSelectedProject()
  const [error, setError] = useState<QueryResponseError>()
  const [showWarning, setShowWarning] = useState(false)
  const { newQuery } = useNewQuery()

  const { mutate: executeSql, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: (res) => {
      console.log('SQL executed successfully:', res)
      setShowResults(true)
      setResults(res.result)
      setShowWarning(false)
    },
    onError: (error) => {
      setError(error)
      setResults([])
      setShowWarning(false)
    },
  })

  const handleExecute = useCallback(() => {
    if (!project?.ref || !sql || readOnly) return

    if (!isReadOnlySelect(sql)) {
      setShowCode(true)
      setShowWarning(true)
      return
    }

    setError(undefined)
    executeSql({
      sql: suffixWithLimit(sql, 100),
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      handleError: (error) => {
        setError(error)
        setResults([])
      },
    })
  }, [project?.ref, project?.connectionString, sql, executeSql, readOnly])

  useEffect(() => {
    if (isReadOnlySelect(sql) && !results && !readOnly) {
      handleExecute()
    }
  }, [sql, handleExecute, readOnly])

  const handleEdit = () => {
    if (!readOnly) {
      newQuery(sql, title)
    }
  }

  const [errorHeader, ...errorContent] =
    (error?.formattedError?.split('\n') ?? [])?.filter((x: string) => x.length > 0) ?? []

  return (
    <div className="overflow-hidden">
      <div className="flex items-center px-5 py-2 gap-2">
        {showWarning ? (
          <div className="py-2">
            <FileWarning strokeWidth={1.5} size={20} className="text-warning-600 mb-3" />
            <h3 className="text-sm font-medium flex-1">
              This query contains write operations. Are you sure you want to execute it?
            </h3>
            <div className="flex justify-stretch mt-2 gap-2">
              <Button
                type="outline"
                size="tiny"
                className="w-full flex-1"
                onClick={() => setShowWarning(false)}
              >
                Cancel
              </Button>
              <Button
                type="outline"
                size="tiny"
                className="w-full flex-1"
                onClick={() => {
                  setShowWarning(false)
                  executeSql({
                    sql: suffixWithLimit(sql, 100),
                    projectRef: project?.ref,
                    connectionString: project?.connectionString,
                    handleError: (error) => {
                      setError(error)
                      setResults([])
                    },
                  })
                }}
              >
                Run
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DatabaseIcon size={16} strokeWidth={1.5} />
            <h3 className="text-sm font-medium flex-1">{title}</h3>

            {!readOnly && (
              <div className="flex">
                <Button
                  type="text"
                  size="tiny"
                  className="w-7 h-7"
                  icon={<Code size={14} />}
                  onClick={() => setShowCode(!showCode)}
                ></Button>

                <Button
                  type="text"
                  size="tiny"
                  className="w-7 h-7"
                  icon={<Edit size={14} />}
                  onClick={handleEdit}
                ></Button>

                <Button
                  type="text"
                  size="tiny"
                  className="w-7 h-7"
                  icon={<Play size={14} />}
                  loading={isExecuting}
                  onClick={handleExecute}
                ></Button>
              </div>
            )}
          </>
        )}
      </div>

      {showCode && (
        <CodeBlock
          value={sql}
          language="sql"
          className={cn(
            'max-h-96 block !bg-transparent !py-3 !px-3.5 prose dark:prose-dark border-0 border-t text-foreground !rounded-none w-full',
            '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap [&>code]:block [&>code>span]:text-foreground'
          )}
          hideLineNumbers
        />
      )}

      {/* Results Section */}
      {results !== undefined && results.length > 0 && isChart && xAxis && yAxis ? (
        <div className="p-5 border-t">
          <ChartContainer config={{}} className="aspect-auto h-[250px] w-full">
            <BarChart
              data={results}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey={xAxis}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <ChartTooltip content={<ChartTooltipContent className="w-[150px]" />} />
              <Bar dataKey={yAxis} fill="hsl(var(--chart-2))" />
            </BarChart>
          </ChartContainer>
        </div>
      ) : (
        <div>
          {error !== undefined ? (
            <Admonition
              type="warning"
              className="m-0 rounded-none border-x-0 border-b-0 [&>div>div>pre]:text-sm [&>div]:flex [&>div]:flex-col [&>div]:gap-y-2"
              title={errorHeader || 'Error running SQL query'}
              description={
                <>
                  <div>
                    {errorContent.length > 0 ? (
                      errorContent.map((errorText: string, i: number) => (
                        <pre key={`err-${i}`} className="font-mono text-xs whitespace-pre-wrap">
                          {errorText}
                        </pre>
                      ))
                    ) : (
                      <p className="font-mono text-xs">{error.error}</p>
                    )}
                  </div>
                </>
              }
            />
          ) : results !== undefined && results.length > 0 ? (
            <>
              <div className={cn(showResults ? 'h-auto max-h-64 overflow-auto border-t' : 'h-0')}>
                <Results rows={results} />
              </div>
              <div className="flex items-center justify-between border-t bg-background-muted py-2 pl-2 pr-5">
                <p className="text-xs text-foreground-light">
                  {results.length} rows
                  {results.length >= 100 && ` (Limited to only 100 rows)`}
                </p>
              </div>
            </>
          ) : (
            results !== undefined &&
            results.length === 0 && (
              <div className="flex items-center justify-between border-t bg-surface-100 h-[43px] pl-2 pr-5">
                <p className="text-xs text-foreground-light">Success. No rows returned.</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

export { SqlSnippetWrapper as SqlSnippet }
