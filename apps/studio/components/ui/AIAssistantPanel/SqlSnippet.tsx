import { Code, Edit, Play } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import useNewQuery from 'components/interfaces/SQLEditor/hooks'
import { DiffType } from 'components/interfaces/SQLEditor/SQLEditor.types'
import { suffixWithLimit } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import Results from 'components/interfaces/SQLEditor/UtilityPanel/Results'
import { QueryResponseError, useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useAppStateSnapshot } from 'state/app-state'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  Button,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  CodeBlock,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SQL_ICON,
  cn,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { ButtonTooltip } from '../ButtonTooltip'
import {
  getContextualInvalidationKeys,
  identifyQueryType,
  isReadOnlySelect,
} from './AIAssistant.utils'
import { useParams } from 'common'
import { useQueryClient } from '@tanstack/react-query'
import { Markdown } from 'components/interfaces/Markdown'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { TELEMETRY_EVENTS, TELEMETRY_VALUES } from 'lib/constants/telemetry'

interface SqlSnippetWrapperProps {
  sql: string
  isLoading?: boolean
  readOnly?: boolean
}

const SqlSnippetWrapper = ({
  sql,
  isLoading = false,
  readOnly = false,
}: SqlSnippetWrapperProps) => {
  const formatted = (sql || [''])[0]
  const propsMatch = formatted.match(/--\s*props:\s*(\{[^}]+\})/)
  const props = propsMatch ? JSON.parse(propsMatch[1]) : {}
  const title = props.title || 'SQL Query'
  const updatedFormatted = formatted?.replace(/--\s*props:\s*\{[^}]+\}/, '').trim()

  return (
    <div className="overflow-hidden">
      <SqlCard
        sql={updatedFormatted}
        isChart={props.isChart === 'true'}
        xAxis={props.xAxis}
        yAxis={props.yAxis}
        title={title}
        readOnly={readOnly}
        isLoading={isLoading}
      />
    </div>
  )
}

interface ParsedSqlProps {
  sql: string
  title: string
  isLoading?: boolean
  readOnly?: boolean
  isChart: boolean
  xAxis: string
  yAxis: string
}

export const SqlCard = ({
  sql,
  isChart,
  xAxis,
  yAxis,
  title,
  readOnly = false,
  isLoading = false,
}: ParsedSqlProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const project = useSelectedProject()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const { setAiAssistantPanel } = useAppStateSnapshot()
  const { newQuery } = useNewQuery()

  const isInSQLEditor = router.pathname.includes('/sql')
  const isInNewSnippet = router.pathname.endsWith('/sql')

  const [showCode, setShowCode] = useState(readOnly || !isReadOnlySelect(sql))
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any[]>()
  const [error, setError] = useState<QueryResponseError>()
  const [showWarning, setShowWarning] = useState(false)

  const { mutate: sendEvent } = useSendEventMutation()

  const { mutate: executeSql, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: async (res) => {
      // [Joshen] Only do contextual invalidation within a project context
      if (!!ref) {
        const invalidationKeys = getContextualInvalidationKeys({ ref, pathname: router.pathname })
        await Promise.all(invalidationKeys?.map((x) => queryClient.invalidateQueries(x)))
      }

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
      handleError: (error: any) => {
        setError(error)
        setResults([])
        return { result: [] }
      },
    })
  }, [project?.ref, project?.connectionString, sql, executeSql, readOnly])

  const handleEditInSQLEditor = () => {
    if (isInSQLEditor) {
      snapV2.setDiffContent(sql, DiffType.Addition)
    } else {
      newQuery(sql, title)
    }
  }

  const [errorHeader, ...errorContent] =
    (error?.formattedError?.split('\n') ?? [])?.filter((x: string) => x.length > 0) ?? []

  useEffect(() => {
    if (isReadOnlySelect(sql) && !results && !readOnly && !isLoading) {
      handleExecute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sql, readOnly, isLoading])

  return (
    <div className="overflow-hidden rounded border w-auto">
      <div className={cn('flex items-center gap-2', showWarning ? '' : 'px-3 pr-1 py-1')}>
        {showWarning ? (
          <Admonition type="warning" className="mb-0 rounded-none border-0">
            <p>This query contains write operations. Are you sure you want to execute it?</p>
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
                    handleError: (error: any) => {
                      setError(error)
                      setResults([])
                      return { result: [] }
                    },
                  })

                  sendEvent({
                    action: TELEMETRY_EVENTS.AI_ASSISTANT_V2,
                    value: TELEMETRY_VALUES.RAN_SQL_SUGGESTION,
                    label: 'mutation',
                    category: identifyQueryType(sql) ?? 'unknown',
                  })
                }}
              >
                Run
              </Button>
            </div>
          </Admonition>
        ) : (
          <>
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

            {!readOnly && (
              <div className="flex">
                <ButtonTooltip
                  type="text"
                  size="tiny"
                  className="w-7 h-7"
                  icon={<Code size={14} />}
                  onClick={() => setShowCode(!showCode)}
                  tooltip={{
                    content: { side: 'bottom', text: showCode ? 'Hide query' : 'Show query' },
                  }}
                />

                {!isInSQLEditor || isInNewSnippet ? (
                  <ButtonTooltip
                    type="text"
                    size="tiny"
                    className="w-7 h-7"
                    icon={<Edit size={14} />}
                    onClick={() => {
                      handleEditInSQLEditor()
                      sendEvent({
                        action: TELEMETRY_EVENTS.AI_ASSISTANT_V2,
                        value: TELEMETRY_VALUES.EDIT_IN_SQL_EDITOR,
                      })
                    }}
                    tooltip={{ content: { side: 'bottom', text: 'Edit in SQL Editor' } }}
                  />
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <ButtonTooltip
                        type="text"
                        size="tiny"
                        className="w-7 h-7"
                        icon={<Edit size={14} />}
                        tooltip={{ content: { side: 'bottom', text: 'Edit in SQL Editor' } }}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-36">
                      <DropdownMenuItem
                        onClick={() => snapV2.setDiffContent(sql, DiffType.Addition)}
                      >
                        Insert code
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => snapV2.setDiffContent(sql, DiffType.Modification)}
                      >
                        Replace code
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => snapV2.setDiffContent(sql, DiffType.NewSnippet)}
                      >
                        Create new snippet
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <ButtonTooltip
                  type="text"
                  size="tiny"
                  className="w-7 h-7"
                  icon={<Play size={14} />}
                  loading={isExecuting}
                  onClick={() => {
                    handleExecute()
                    if (isReadOnlySelect(sql)) {
                      sendEvent({
                        action: TELEMETRY_EVENTS.AI_ASSISTANT_V2,
                        value: TELEMETRY_VALUES.RAN_SQL_SUGGESTION,
                        label: 'select',
                      })
                    }
                  }}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      className: 'max-w-56 text-center',
                      text: isExecuting ? (
                        <Markdown
                          className="[&>p]:text-xs text-foreground"
                          content={`Query is running. You may cancel ongoing queries via the [SQL Editor](/project/${ref}/sql?viewOngoingQueries=true).`}
                        />
                      ) : (
                        'Run query'
                      ),
                    },
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {showCode && (
        <CodeBlock
          hideLineNumbers
          wrapLines={false}
          value={sql}
          language="sql"
          className={cn(
            'max-h-96 max-w-none block !bg-transparent !py-3 !px-3.5 prose dark:prose-dark border-0 border-t text-foreground !rounded-none w-full',
            '[&>code]:m-0 [&>code>span]:text-foreground'
          )}
        />
      )}

      {/* Results Section */}
      {results !== undefined && results.length > 0 && isChart && xAxis && yAxis ? (
        <div className="p-3 border-t">
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
                      <div>
                        {errorContent.map((errorText: string, i: number) => (
                          <pre key={`err-${i}`} className="font-mono text-xs whitespace-pre-wrap">
                            {errorText}
                          </pre>
                        ))}
                        <Button
                          type="default"
                          className="mt-2"
                          onClick={() => {
                            setAiAssistantPanel({
                              sqlSnippets: [sql],
                              initialInput: `Help me to debug the attached sql snippet which gives the following error: \n\n${errorHeader}\n${errorContent.join('\n')}`,
                            })
                          }}
                        >
                          Debug
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="font-mono text-xs">{error.error}</p>
                        <Button
                          type="default"
                          className="mt-2"
                          onClick={() => {
                            setAiAssistantPanel({
                              sqlSnippets: [sql],
                              initialInput: `Help me to debug the attached sql snippet which gives the following error: \n\n${error.error}`,
                            })
                          }}
                        >
                          Debug
                        </Button>
                      </>
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
