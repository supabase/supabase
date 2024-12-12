import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Code, Play, DatabaseIcon } from 'lucide-react'
import { Button, cn, ChartContainer, ChartTooltip, ChartTooltipContent, SQL_ICON } from 'ui'
import { BarChart, Bar, XAxis, CartesianGrid } from 'recharts'
import CodeBlock from '../CodeBlock/CodeBlock'

interface SqlSnippetProps {
  id: string
  sql: string
  title?: string
  resultType?: 'chart' | 'table'
  mockData?: any
}

// Example mock data matching the Results component format
const MOCK_TABLE_DATA = {
  rows: [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      created_at: '2024-01-15T10:00:00Z',
      status: 'active',
      metadata: { role: 'admin', last_login: '2024-01-14' },
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      created_at: '2024-01-14T15:30:00Z',
      status: 'pending',
      metadata: null,
    },
    {
      id: 3,
      name: 'Bob Wilson',
      email: 'bob@example.com',
      created_at: '2024-01-13T09:15:00Z',
      status: 'active',
      metadata: { role: 'user', last_login: '2024-01-12' },
    },
  ],
}

const MOCK_CHART_DATA = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 700 },
]

export const SqlSnippet = ({
  id,
  sql,
  title = 'SQL Query',
  resultType = 'table',
  mockData,
}: SqlSnippetProps) => {
  const [showCode, setShowCode] = useState(!mockData)
  const [isExecuting, setIsExecuting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleExecute = () => {
    setIsExecuting(true)
    setShowResults(false)

    // Simulate SQL execution delay
    setTimeout(() => {
      setIsExecuting(false)
      if (mockData) {
        setShowResults(true)
        // Use provided mock data or default mock data
        setResults(
          resultType === 'chart'
            ? mockData || MOCK_CHART_DATA
            : mockData?.rows || MOCK_TABLE_DATA.rows
        )
      }
    }, 1000)
  }

  // Auto-execute on mount
  useEffect(() => {
    handleExecute()
  }, [])

  const ResultsDisplay = () => {
    if (resultType === 'chart') {
      return (
        <div className="px-0 py-5 border-t border-t-muted">
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
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={16}
                padding={{ left: 24, right: 24 }}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent className="w-[150px]" />}
              />
              <Bar dataKey="value" fill="hsl(var(--brand-default))" />
            </BarChart>
          </ChartContainer>
        </div>
      )
    }

    return (
      <>
        <div className={cn(showResults ? 'h-auto max-h-64 overflow-auto border-t' : 'h-0')}>
          <table className="w-full m-0 p-0">
            <thead>
              <tr className="bg-surface-100 border-b">
                {results?.length > 0 &&
                  Object.keys(results[0]).map((key) => (
                    <th key={key} className="p-2 px-5 text-left text-xs font-mono">
                      {key}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {results?.map((row: any, i: number) => (
                <tr key={i} className="border-b">
                  {Object.values(row).map((value: any, j: number) => (
                    <td key={j} className="p-2 px-5 text-left text-xs font-mono">
                      {value === null
                        ? 'NULL'
                        : typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between bg-surface-100 py-2 px-4">
          <p className="text-xs text-foreground-light">
            {results.length} rows
            {results.length >= 100 && ' (Limited to only 100 rows)'}
          </p>
        </div>
      </>
    )
  }

  return (
    <div className="my-3 mt-2 border rounded bg-surface-100 overflow-hidden">
      <div className="">
        <div className="flex items-center gap-2 px-4 py-1">
          <SQL_ICON
            className={cn(
              'transition-colors',
              'fill-foreground-muted',
              'group-aria-selected:fill-foreground',
              'w-5 h-5 shrink-0',
              '-ml-0.5'
            )}
            size={16}
            strokeWidth={1.5}
          />
          <h3 className="text-xs font-medium flex-1">{title}</h3>
          <div className="flex">
            <Button
              type="text"
              size="tiny"
              className="w-7 h-7"
              icon={<Code size={14} />}
              onClick={() => setShowCode(!showCode)}
            />
            <Button
              type="text"
              size="tiny"
              className="w-7 h-7"
              icon={<Play size={14} />}
              loading={isExecuting}
              onClick={handleExecute}
            />
          </div>
        </div>

        {showCode && (
          <div className="border-t">
            <CodeBlock className="border-0 rounded-none" showLineNumbers lang="sql">
              {sql}
            </CodeBlock>
          </div>
        )}

        {isExecuting ? (
          <motion.div className="text-foreground-lighter text-sm flex gap-1.5 items-center p-5">
            <span>Executing query</span>
            <div className="flex gap-1">
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              >
                .
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              >
                .
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
              >
                .
              </motion.span>
            </div>
          </motion.div>
        ) : showResults && results ? (
          <ResultsDisplay />
        ) : null}
      </div>
    </div>
  )
}
