import { useState, useEffect, useCallback } from 'react'
import { Code, Play, Edit, DatabaseIcon } from 'lucide-react'
import { Button, CodeBlock, cn } from 'ui'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { suffixWithLimit } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import Results from 'components/interfaces/SQLEditor/UtilityPanel/Results'
import { BarChart, Bar, XAxis, CartesianGrid } from 'recharts'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from 'ui'
import { Database } from 'icons'

interface SqlSnippetProps {
  sql: string
  isLoading?: boolean
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
    '(',
    'function',
    'procedure',
  ]

  // Check if query contains any disallowed patterns
  return !disallowedPatterns.some((pattern) => normalizedQuery.includes(pattern))
}

export const SqlSnippet = ({ sql, isLoading }: SqlSnippetProps) => {
  let formatted = (sql || [''])[0]

  const [showCode, setShowCode] = useState(!isReadOnlySelect(formatted))
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any[]>()
  const project = useSelectedProject()

  const propsMatch = formatted.match(/--\s*props:\s*(\{[^}]+\})/)
  console.log('formatted:', formatted, propsMatch)

  const props = propsMatch ? JSON.parse(propsMatch[1]) : {}
  const title = props.title || 'SQL Query'

  console.log('props:', props)

  formatted = formatted.replace(/--\s*props:\s*\{[^}]+\}/, '').trim()

  const { mutate: executeSql, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: (res) => {
      console.log('SQL executed successfully:', res)
      setShowResults(true)
      setResults(res.result)
    },
    onError: (error) => {
      console.error('SQL execution failed:', error)
      setResults(undefined)
    },
  })

  const handleExecute = useCallback(() => {
    if (!project?.ref || !formatted) return

    executeSql({
      sql: suffixWithLimit(formatted, 100),
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      handleError: (error) => {
        console.log('error:', error)
        throw error
      },
    })
  }, [project?.ref, project?.connectionString, formatted, executeSql])

  useEffect(() => {
    if (isReadOnlySelect(formatted)) {
      handleExecute()
    }
  }, [formatted, handleExecute])

  const handleEdit = () => {
    alert('saved')
  }

  console.log('results:', results)

  return (
    <div className="bg-background-muted -mx-5 border-t border-b overflow-hidden">
      <div className="flex items-center px-5 py-2 gap-2">
        <DatabaseIcon size={16} strokeWidth={1.5} />
        <h3 className="text-sm font-medium flex-1">{title}</h3>

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
            icon={<Play size={14} />}
            loading={isExecuting}
            onClick={handleExecute}
          ></Button>

          <Button
            type="text"
            size="tiny"
            className="w-7 h-7"
            icon={<Edit size={14} />}
            onClick={handleEdit}
          ></Button>
        </div>
      </div>

      {showCode && (
        <CodeBlock
          value={formatted}
          language="sql"
          className={cn(
            '!bg-transparent !py-3 !px-3.5 prose dark:prose-dark border-0 border-t text-foreground !rounded-none',
            // change the look of the code block. The flex hack is so that the code is wrapping since
            // every word is a separate span
            '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap [&>code]:block [&>code>span]:text-foreground'
          )}
          hideLineNumbers
        />
      )}

      {/* Results Section */}
      {results !== undefined &&
      results.length > 0 &&
      props.isChart &&
      props.xAxis &&
      props.yAxis ? (
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
                dataKey={props.xAxis}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <ChartTooltip content={<ChartTooltipContent className="w-[150px]" />} />
              <Bar dataKey={props.yAxis} fill="hsl(var(--chart-2))" />
            </BarChart>
          </ChartContainer>
        </div>
      ) : (
        results !== undefined &&
        results.length > 0 && (
          <>
            <div className={cn(showResults ? 'h-auto max-h-64 overflow-auto border-t' : 'h-0')}>
              <Results rows={results} />
            </div>
            <div className="flex items-center justify-between border-t bg-surface-100 py-2 pl-2 pr-5">
              <p className="text-xs text-foreground-light">
                {results.length} rows
                {results.length >= 100 && ` (Limited to only 100 rows)`}
              </p>
            </div>
          </>
        )
      )}
      {results !== undefined && results.length === 0 && (
        <div className="flex items-center justify-between border-t bg-surface-100 h-[43px] pl-2 pr-5">
          <p className="text-xs text-foreground-light">Success. No rows returned.</p>
        </div>
      )}
    </div>
  )
}
