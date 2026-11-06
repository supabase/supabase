'use client'

import { Editor } from '@monaco-editor/react'
import {
  AlertTriangle,
  ArrowUp,
  BarChart as BarChartIcon,
  FileText,
  Loader2,
  Wand,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Alert, AlertDescription, AlertTitle } from '@/registry/default/components/ui/alert'
import { Button } from '@/registry/default/components/ui/button'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/registry/default/components/ui/chart'
import { Input } from '@/registry/default/components/ui/input'
import { Label } from '@/registry/default/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/default/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/default/components/ui/select'
import { Skeleton } from '@/registry/default/components/ui/skeleton'
import { Switch } from '@/registry/default/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/registry/default/components/ui/toggle-group'
import { ResultsTable } from '@/registry/default/platform/platform-kit-nextjs/components/results-table'
import { useRunQuery } from '@/registry/default/platform/platform-kit-nextjs/hooks/use-run-query'

interface SqlEditorProps {
  projectRef: string
  initialSql?: string
  queryKey?: any
  label?: string
  onResults?: (data: any[] | undefined) => void
  onRowClick?: (row: any, queryKey?: any) => void
  hideSql?: boolean
  readOnly?: boolean
  runAutomatically?: boolean
  refetch?: number
  initialNaturalLanguageMode?: boolean
  hideChartOption?: boolean
}

export function SqlEditor({
  projectRef,
  initialSql,
  queryKey,
  onResults,
  onRowClick,
  label = 'Query your data',
  hideSql = false,
  readOnly = false,
  runAutomatically = false,
  refetch,
  initialNaturalLanguageMode = false,
  hideChartOption = false,
}: SqlEditorProps) {
  const [sql, setSql] = useState(initialSql || '')
  const [isSqlVisible, setIsSqlVisible] = useState(!hideSql)
  const [isNaturalLanguageMode, setIsNaturalLanguageMode] = useState(
    process.env.NEXT_PUBLIC_ENABLE_AI_QUERIES === 'true' && initialNaturalLanguageMode
  )
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('')
  const { mutate: runQuery, data, isPending, error } = useRunQuery()
  const [isGeneratingSql, setIsGeneratingSql] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [isChartVisible, setIsChartVisible] = useState(false)
  const [xAxisColumn, setXAxisColumn] = useState<string | null>(null)
  const [yAxisColumn, setYAxisColumn] = useState<string | null>(null)

  const columns = useMemo(() => {
    if (!data || data.length === 0) return []
    return Object.keys(data[0])
  }, [data])

  useEffect(() => {
    if (initialSql) {
      setSql(initialSql)
    }
  }, [initialSql])

  const handleRunNaturalLanguageQuery = async () => {
    if (!naturalLanguageQuery) return

    setIsGeneratingSql(true)
    setAiError(null)
    try {
      const response = await fetch('/api/ai/sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: naturalLanguageQuery,
          projectRef,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to generate SQL')
      }

      const { sql: generatedSql } = await response.json()
      setSql(generatedSql)
      runQuery({ projectRef, query: generatedSql, readOnly: true })
    } catch (error: any) {
      console.error(error)
      setAiError(error.message)
    } finally {
      setIsGeneratingSql(false)
    }
  }

  const handleRunQuery = useCallback(() => {
    if (sql) {
      runQuery({ projectRef, query: sql, readOnly: true })
    }
  }, [sql, projectRef, runQuery])

  useEffect(() => {
    setIsSqlVisible(!hideSql)
  }, [hideSql])

  useEffect(() => {
    if (runAutomatically && initialSql) {
      runQuery({ projectRef, query: initialSql, readOnly: true })
    }
  }, [runAutomatically, initialSql, projectRef, runQuery])

  useEffect(() => {
    if (refetch && refetch > 0) {
      handleRunQuery()
    }
  }, [refetch, handleRunQuery])

  useEffect(() => {
    if (onResults) {
      onResults(data)
    }
  }, [data, onResults])

  useEffect(() => {
    const noResults = !data || (Array.isArray(data) && data.length === 0)
    if (noResults && !isSqlVisible && !isNaturalLanguageMode && !readOnly && !isPending) {
      setIsSqlVisible(true)
    }
  }, [data, isSqlVisible, isNaturalLanguageMode])

  const serverErrorMessage = (error as any)?.response?.data?.message || ''
  const isReadOnlyError =
    serverErrorMessage.includes('permission denied') || serverErrorMessage.includes('42501')
  const customReadOnlyError = "You can't directly alter your database schema, use chat instead"

  // Build the toggle-group selection based on current UI state
  const toggleValues = useMemo(() => {
    const values: string[] = []
    if (isNaturalLanguageMode) values.push('chat')
    if (isSqlVisible) values.push('sql')
    if (!hideChartOption && isChartVisible) values.push('chart')
    return values
  }, [isNaturalLanguageMode, isSqlVisible, isChartVisible, hideChartOption])

  const handleToggleGroupChange = (values: string[]) => {
    setIsNaturalLanguageMode(values.includes('chat'))
    setIsSqlVisible(values.includes('sql'))
    if (!hideChartOption) {
      setIsChartVisible(values.includes('chart'))
    }
  }

  return (
    <div>
      <div className="px-6 pt-4 lg:px-8 lg:pt-8">
        <div className="flex items-center gap-4 mb-4    ">
          <h2 className="font-semibold flex-1">{label}</h2>
          <ToggleGroup
            type="multiple"
            size="sm"
            value={toggleValues}
            onValueChange={handleToggleGroupChange}
            className="gap-1"
          >
            {process.env.NEXT_PUBLIC_ENABLE_AI_QUERIES === 'true' && (
              <ToggleGroupItem value="chat" aria-label="Chat">
                <Wand className="h-4 w-4" />
              </ToggleGroupItem>
            )}
            <ToggleGroupItem value="sql" aria-label="SQL">
              <FileText className="h-4 w-4" />
            </ToggleGroupItem>
            {!hideChartOption && (
              <Popover>
                <PopoverTrigger asChild>
                  <ToggleGroupItem value="chart" aria-label="Chart">
                    <BarChartIcon className="h-4 w-4" />
                  </ToggleGroupItem>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                          <Label className="flex-1 mb-2 block">Show Chart</Label>
                          <p className="text-xs text-muted-foreground">
                            Visualize your data with a chart.
                          </p>
                        </div>
                        <Switch
                          id="show-chart"
                          size="sm"
                          className="mb-0"
                          checked={isChartVisible}
                          onCheckedChange={setIsChartVisible}
                        />
                      </div>
                      {isChartVisible && (
                        <div className="mt-2">
                          <div className="grid grid-cols-3 items-center gap-4 mb-2">
                            <Label htmlFor="x-axis">X-Axis</Label>
                            <Select
                              onValueChange={setXAxisColumn}
                              defaultValue={xAxisColumn || undefined}
                            >
                              <SelectTrigger className="col-span-2 h-8">
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                              <SelectContent>
                                {columns.map((col) => (
                                  <SelectItem key={col} value={col}>
                                    {col}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-3 items-center gap-4 mb-2">
                            <Label htmlFor="y-axis">Y-Axis</Label>
                            <Select
                              onValueChange={setYAxisColumn}
                              defaultValue={yAxisColumn || undefined}
                            >
                              <SelectTrigger className="col-span-2 h-8">
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                              <SelectContent>
                                {columns.map((col) => (
                                  <SelectItem key={col} value={col}>
                                    {col}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </ToggleGroup>
        </div>
        <div>
          {isNaturalLanguageMode && (
            <div className="relative mb-4">
              <Wand
                strokeWidth={1.5}
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2"
              />
              <Input
                placeholder="e.g. Show me all users who signed up in the last 7 days"
                value={naturalLanguageQuery}
                onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleRunNaturalLanguageQuery()
                  }
                }}
                className="w-full px-10"
              />
              <Button
                onClick={handleRunNaturalLanguageQuery}
                disabled={isGeneratingSql || isPending}
                className="h-7 w-7 rounded-full p-0 shrink-0 absolute right-1 top-1/2 -translate-y-1/2"
              >
                {isGeneratingSql ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ArrowUp size={16} />
                )}
              </Button>
            </div>
          )}
          {isSqlVisible && (
            <div className="border-t border-b bg-muted overflow-hidden -mx-6 lg:-mx-8 mt-4 relative">
              <Editor
                height="200px"
                language="sql"
                value={sql}
                onChange={(value) => setSql(value || '')}
                theme="vs-dark"
                className="bg-transparent"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  readOnly,
                  padding: {
                    top: 24,
                    bottom: 24,
                  },
                }}
              />
              <Button
                size="sm"
                onClick={handleRunQuery}
                disabled={isPending}
                className="absolute bottom-4 right-4"
              >
                {isPending ? 'Running...' : 'Run Query'}
              </Button>
            </div>
          )}
        </div>
      </div>
      {isPending && (
        <div className="space-y-2 p-4 px-6 lg:px-8">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      )}
      {aiError && (
        <div className="px-6 lg:px-8 py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error generating SQL</AlertTitle>
            <AlertDescription>{aiError}</AlertDescription>
          </Alert>
        </div>
      )}
      {error && (
        <div className="px-6 lg:px-8 py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Query Error</AlertTitle>
            <AlertDescription>
              {isReadOnlyError
                ? customReadOnlyError
                : serverErrorMessage || (error as Error)?.message || 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {!hideChartOption && data && isChartVisible && xAxisColumn && yAxisColumn && (
        <div className="px-8 mt-8 mb-4">
          <QueryResultChart data={data} xAxis={xAxisColumn} yAxis={yAxisColumn} />
        </div>
      )}

      {data && (
        <div>
          <ResultsTable data={data} onRowClick={(row) => onRowClick?.(row, queryKey)} />
        </div>
      )}
    </div>
  )
}

function QueryResultChart({ data, xAxis, yAxis }: { data: any[]; xAxis: string; yAxis: string }) {
  const chartConfig = {
    [yAxis]: {
      label: yAxis,
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
      <BarChart
        accessibilityLayer
        data={data}
        margin={{
          left: -24,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis dataKey={xAxis} tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} />
        <YAxis
          dataKey={yAxis}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickCount={5}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent className="w-[150px]" indicator="dot" />} />
        <Bar dataKey={yAxis} fill={`var(--color-${yAxis})`} />
      </BarChart>
    </ChartContainer>
  )
}
