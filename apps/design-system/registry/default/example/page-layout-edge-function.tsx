'use client'

import { Check, Clock, CornerDownLeft, ExternalLink, File, Plus } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import {
  Badge,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  cn,
  flattenTree,
  NavMenu,
  NavMenuItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TreeView,
  TreeViewItem,
  type ChartConfig,
  type INodeRendererProps,
} from 'ui'
import {
  Chart,
  ChartActions,
  ChartCard,
  ChartContent,
  ChartHeader,
  ChartLine,
  ChartLoadingState,
  ChartMetric,
} from 'ui-patterns/Chart'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'
import { PageBreadcrumbs, PageBreadcrumbsActions } from 'ui-patterns/PageBreadcrumbs'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageNav } from 'ui-patterns/PageNav'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { PageLayoutLogsContent } from './page-layout-logs-content'

type PageId = 'overview' | 'logs' | 'code' | 'settings'

const pages: { id: PageId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'logs', label: 'Logs' },
  { id: 'code', label: 'Code' },
  { id: 'settings', label: 'Settings' },
]

const CHART_INTERVALS = [
  { key: '15min', label: '15 min', format: 'MMM D, h:mm:ssa', minutes: 15 },
  { key: '1hr', label: '1 hour', format: 'MMM D, h:mma', minutes: 60 },
  { key: '3hr', label: '3 hours', format: 'MMM D, h:mma', minutes: 180 },
  { key: '1day', label: '1 day', format: 'MMM D, h:mma', minutes: 24 * 60 },
] as const

const FUNCTION_URL = 'https://demo.supabase.co/functions/v1/hello-world'

type MockInvocationDatum = {
  timestamp: string
  ok_count: number
  warning_count: number
  error_count: number
}

type MockMetricsDatum = MockInvocationDatum & {
  avg_execution_time: number
  max_execution_time: number
  avg_cpu_time_used: number
  max_cpu_time_used: number
  avg_memory_used: number
  avg_heap_memory_used: number
  avg_external_memory_used: number
}

const pseudoNoise = (seed: number, amplitude = 1) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return (value - Math.floor(value)) * amplitude
}

const getIntervalMinutes = (intervalKey: string) =>
  CHART_INTERVALS.find((item) => item.key === intervalKey)?.minutes ?? 60

const buildMockChartData = (intervalKey: string) => {
  const minutes = getIntervalMinutes(intervalKey)
  const end = new Date()
  end.setSeconds(0, 0)

  const invocation: MockInvocationDatum[] = Array.from({ length: minutes }, (_, index) => {
    const timestamp = new Date(end)
    timestamp.setMinutes(end.getMinutes() - (minutes - 1 - index))

    const progress = minutes <= 1 ? 0 : index / (minutes - 1)
    const baseLoad = 12 + Math.round(progress * 28)
    const noise = Math.round(pseudoNoise(index + minutes * 0.1, 8))

    const ok_count = baseLoad + noise
    const warning_count = index % 17 === 0 ? 2 + (index % 3) : index % 11 === 0 ? 1 : 0
    const error_count = index % 43 === 0 ? 3 + (index % 2) : 0

    return {
      timestamp: timestamp.toISOString(),
      ok_count,
      warning_count,
      error_count,
    }
  })

  const metrics: MockMetricsDatum[] = invocation.map((datum, index) => {
    const avg_execution_time = Math.round(68 + pseudoNoise(index + 2, 24) + index * 0.15)
    const max_execution_time = Math.round(
      avg_execution_time * (1.25 + pseudoNoise(index + minutes, 0.35))
    )

    return {
      ...datum,
      avg_execution_time,
      max_execution_time,
      avg_cpu_time_used: Math.round(8 + pseudoNoise(index + 4, 10) + index * 0.05),
      max_cpu_time_used: Math.round(16 + pseudoNoise(index + 6, 18) + index * 0.1),
      avg_memory_used: Number((40 + pseudoNoise(index + 8, 12) + index * 0.08).toFixed(1)),
      avg_heap_memory_used: Number((24 + pseudoNoise(index + 10, 8) + index * 0.05).toFixed(1)),
      avg_external_memory_used: Number((14 + pseudoNoise(index + 12, 6) + index * 0.04).toFixed(1)),
    }
  })

  return { invocation, metrics }
}

const EXECUTION_TIME_CHART_CONFIG = {
  avg_execution_time: {
    label: 'Average Execution Time',
    color: 'hsl(var(--foreground-default))',
  },
  max_execution_time: {
    label: 'Max Execution Time',
    color: 'hsl(var(--brand-default))',
  },
} satisfies ChartConfig

const CPU_TIME_CHART_CONFIG = {
  max_cpu_time_used: {
    label: 'Max CPU Time',
    color: 'hsl(var(--brand-default))',
  },
} satisfies ChartConfig

const MEMORY_CHART_CONFIG = {
  avg_memory_used: {
    label: 'Memory Usage',
    color: 'hsl(var(--brand-default))',
  },
} satisfies ChartConfig

type MockFileData = {
  id: number
  name: string
  content: string
  state: 'new' | 'modified' | 'unchanged'
}

const MOCK_CODE_FILES: MockFileData[] = [
  {
    id: 1,
    name: 'index.ts',
    state: 'modified',
    content: `import { serve } from 'https://deno.land/std/http/server.ts'

serve(async (req) => {
  const { name = 'World' } = await req.json().catch(() => ({}))

  return new Response(
    JSON.stringify({ message: \`Hello \${name}\` }),
    { headers: { 'content-type': 'application/json' } }
  )
})`,
  },
  {
    id: 2,
    name: 'deno.json',
    state: 'unchanged',
    content: JSON.stringify({ imports: {} }, null, '\t'),
  },
]

const formatRate = (count: number, total: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(total === 0 ? 0 : count / total)

const formatMetric = (value: number, unit?: string) => {
  const formatted = unit === 'MB' ? value.toFixed(1) : Math.round(value).toLocaleString('en-US')
  return unit ? `${formatted}${unit}` : formatted
}

const getSegmentedButtonClassName = (index: number, total: number) => {
  if (index === 0) return 'rounded-tr-none rounded-br-none'
  if (index === total - 1) return 'rounded-tl-none rounded-bl-none'
  return 'rounded-none'
}

const sumBy = <T,>(items: T[], getValue: (item: T) => number) =>
  items.reduce((total, item) => total + getValue(item), 0)

const meanBy = <T,>(items: T[], getValue: (item: T) => number) =>
  items.length === 0 ? 0 : sumBy(items, getValue) / items.length

export default function PageLayoutEdgeFunction() {
  const [activePage, setActivePage] = useState<PageId>('overview')

  return (
    <div className="w-full">
      <PageBreadcrumbs
        actions={
          <PageBreadcrumbsActions>
            <Button variant="default" size="tiny">
              Test
            </Button>
            <Button variant="primary" size="tiny">
              Deploy
            </Button>
          </PageBreadcrumbsActions>
        }
      >
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/project/demo/functions">Edge Functions</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>hello-world</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </PageBreadcrumbs>

      <PageNav>
        <NavMenu>
          {pages.map((page) => (
            <NavMenuItem key={page.id} active={activePage === page.id}>
              <button
                type="button"
                aria-pressed={activePage === page.id}
                className="h-full cursor-pointer appearance-none bg-transparent text-inherit"
                onClick={() => setActivePage(page.id)}
              >
                {page.label}
              </button>
            </NavMenuItem>
          ))}
        </NavMenu>
      </PageNav>

      {activePage === 'overview' && <OverviewPage />}
      {activePage === 'logs' && (
        <PageContainer size="full" className="px-0 xl:px-0">
          <PageLayoutLogsContent />
        </PageContainer>
      )}
      {activePage === 'code' && (
        <PageContainer size="full" className="px-0 xl:px-0">
          <CodePage />
        </PageContainer>
      )}
      {activePage === 'settings' && <SettingsPage />}
    </div>
  )
}

function OverviewPage() {
  const [interval, setInterval] = useState<string>('1hr')
  const selectedInterval =
    CHART_INTERVALS.find((item) => item.key === interval) ?? CHART_INTERVALS[1]
  const dateTimeFormat = selectedInterval.format

  const { invocation: mockInvocationChartData, metrics: mockMetricsChartData } = useMemo(
    () => buildMockChartData(interval),
    [interval]
  )

  const { totalInvocationCount, totalWarningCount, totalErrorCount } = useMemo(() => {
    const totalInvocationCount = sumBy(
      mockInvocationChartData,
      (datum) => datum.ok_count + datum.warning_count + datum.error_count
    )

    return {
      totalInvocationCount,
      totalWarningCount: sumBy(mockInvocationChartData, (datum) => datum.warning_count),
      totalErrorCount: sumBy(mockInvocationChartData, (datum) => datum.error_count),
    }
  }, [mockInvocationChartData])

  const { averageExecutionTime, maxExecutionTime } = useMemo(
    () => ({
      averageExecutionTime: meanBy(mockMetricsChartData, (datum) => datum.avg_execution_time),
      maxExecutionTime: Math.max(...mockMetricsChartData.map((datum) => datum.max_execution_time)),
    }),
    [mockMetricsChartData]
  )

  const { averageCpuTime, maxCpuTime, averageMemoryUsage, totalHeapMemory, totalExternalMemory } =
    useMemo(() => {
      const totalHeapMemory = sumBy(mockMetricsChartData, (datum) => datum.avg_heap_memory_used)
      const totalExternalMemory = sumBy(
        mockMetricsChartData,
        (datum) => datum.avg_external_memory_used
      )

      return {
        averageCpuTime: meanBy(mockMetricsChartData, (datum) => datum.avg_cpu_time_used),
        maxCpuTime: Math.max(...mockMetricsChartData.map((datum) => datum.max_cpu_time_used)),
        averageMemoryUsage: meanBy(mockMetricsChartData, (datum) => datum.avg_memory_used),
        totalHeapMemory,
        totalExternalMemory,
      }
    }, [mockMetricsChartData])

  const invocationActions = [
    {
      label: 'Open logs',
      href: '#',
      icon: <ExternalLink size={12} />,
    },
  ]

  return (
    <>
      <PageHeader size="small" className="pb-12">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>hello-world</PageHeaderTitle>
            <PageHeaderDescription className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1 text-sm!">
              <span>{FUNCTION_URL}</span>
              <span className="flex items-center gap-2">
                <Clock size={16} strokeWidth={1.5} className="text-foreground-lighter" />
                <span>Last deployed 2 hours ago</span>
              </span>
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageSection className="border-t bg-surface-100/50 border-b pb-8 pt-0">
        <PageContainer size="full">
          <div className="flex flex-col gap-5">
            <PageSectionMeta className="items-center! pt-8">
              <PageSectionSummary>
                <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
                  <ChartMetric
                    label="Total Invocations"
                    value={totalInvocationCount}
                    status="default"
                    tooltip="Total number of invocations"
                  />
                  <ChartMetric
                    label="5xx Rate"
                    value={formatRate(totalErrorCount, totalInvocationCount)}
                    status="negative"
                    tooltip="Share of invocations that returned a 5xx status code"
                  />
                  <ChartMetric
                    label="4xx Rate"
                    value={formatRate(totalWarningCount, totalInvocationCount)}
                    status="warning"
                    tooltip="Share of invocations that returned a 4xx status code"
                  />
                </div>
              </PageSectionSummary>
              <PageSectionAside className="flex-wrap @xl:self-center">
                <div className="flex items-center">
                  {CHART_INTERVALS.map((item, index) => (
                    <Button
                      key={item.key}
                      variant={interval === item.key ? 'secondary' : 'default'}
                      onClick={() => setInterval(item.key)}
                      className={getSegmentedButtonClassName(index, CHART_INTERVALS.length)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
                <ChartActions actions={invocationActions} />
              </PageSectionAside>
            </PageSectionMeta>
            <Chart>
              <div className="h-40">
                <LogsBarChart
                  data={mockInvocationChartData}
                  DateTimeFormat={dateTimeFormat}
                  isFullHeight
                />
              </div>
            </Chart>
          </div>
        </PageContainer>
      </PageSection>

      <PageContainer size="small">
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Errors since last deploy</PageSectionTitle>
            </PageSectionSummary>
            <PageSectionAside>
              <Button variant="default" size="tiny" icon={<ExternalLink size={14} />}>
                View logs
              </Button>
            </PageSectionAside>
          </PageSectionMeta>
          <PageSectionContent>
            <div className="rounded-md border border-dashed px-5 py-6 text-sm text-foreground-light">
              <div className="flex items-start gap-3">
                <Check
                  size={16}
                  strokeWidth={1.5}
                  className="mt-0.5 shrink-0 text-brand"
                  aria-hidden="true"
                />
                <div>
                  There have been <span className="text-foreground">847 invocations</span> since
                  last deploy and no errors.
                </div>
              </div>
            </div>
          </PageSectionContent>
        </PageSection>

        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Performance</PageSectionTitle>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <Chart>
              <ChartCard>
                <ChartHeader align="start">
                  <div className="flex flex-wrap gap-x-8 gap-y-4">
                    <ChartMetric
                      label="Average Execution Time"
                      value={formatMetric(averageExecutionTime, 'ms')}
                      tooltip="Average execution time of function invocations"
                    />
                    <ChartMetric
                      label="Max Execution Time"
                      value={formatMetric(maxExecutionTime, 'ms')}
                      tooltip="Maximum execution time of function invocations"
                    />
                  </div>
                </ChartHeader>
                <ChartContent loadingState={<ChartLoadingState />}>
                  <div className="h-40">
                    <ChartLine
                      data={mockMetricsChartData}
                      dataKey="max_execution_time"
                      dataKeys={['avg_execution_time', 'max_execution_time']}
                      DateTimeFormat={dateTimeFormat}
                      config={EXECUTION_TIME_CHART_CONFIG}
                      isFullHeight
                      showYAxis
                      referenceLines={[
                        {
                          y: averageExecutionTime,
                          label: 'average',
                          stroke: 'hsl(var(--foreground-default))',
                          strokeWidth: 1.5,
                        },
                      ]}
                      YAxisProps={{
                        width: 64,
                        tickFormatter: (value: number) => `${Math.round(value)}ms`,
                      }}
                    />
                  </div>
                </ChartContent>
              </ChartCard>
            </Chart>
          </PageSectionContent>
        </PageSection>

        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Usage</PageSectionTitle>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <div className="flex flex-col gap-6">
              <Chart>
                <ChartCard>
                  <ChartHeader align="start">
                    <div className="flex flex-wrap gap-x-8 gap-y-4">
                      <ChartMetric
                        label="Average CPU Time"
                        value={formatMetric(averageCpuTime, 'ms')}
                        tooltip="Average CPU time usage for the function"
                      />
                      <ChartMetric
                        label="Max CPU Time"
                        value={formatMetric(maxCpuTime, 'ms')}
                        tooltip="Maximum CPU time usage for the function"
                      />
                    </div>
                  </ChartHeader>
                  <ChartContent loadingState={<ChartLoadingState />}>
                    <div className="h-40">
                      <ChartLine
                        data={mockMetricsChartData}
                        dataKey="max_cpu_time_used"
                        DateTimeFormat={dateTimeFormat}
                        config={CPU_TIME_CHART_CONFIG}
                        isFullHeight
                        showYAxis
                        referenceLines={[
                          {
                            y: averageCpuTime,
                            label: 'average',
                            stroke: 'hsl(var(--foreground-default))',
                            strokeWidth: 1.5,
                          },
                        ]}
                        YAxisProps={{
                          width: 64,
                          tickFormatter: (value: number) => `${Math.round(value)}ms`,
                        }}
                      />
                    </div>
                  </ChartContent>
                </ChartCard>
              </Chart>

              <Chart>
                <ChartCard>
                  <ChartHeader align="start">
                    <div className="flex flex-wrap gap-x-8 gap-y-4">
                      <ChartMetric
                        label="Average Memory Usage"
                        value={formatMetric(averageMemoryUsage, 'MB')}
                        tooltip="Average memory usage for the function"
                      />
                      <ChartMetric
                        label="Heap"
                        value={formatRate(totalHeapMemory, totalHeapMemory + totalExternalMemory)}
                        tooltip="Share of memory attributed to heap usage over the selected interval"
                      />
                      <ChartMetric
                        label="External"
                        value={formatRate(
                          totalExternalMemory,
                          totalHeapMemory + totalExternalMemory
                        )}
                        tooltip="Share of memory attributed to external usage over the selected interval"
                      />
                    </div>
                  </ChartHeader>
                  <ChartContent loadingState={<ChartLoadingState />}>
                    <div className="h-40">
                      <ChartLine
                        data={mockMetricsChartData}
                        dataKey="avg_memory_used"
                        DateTimeFormat={dateTimeFormat}
                        config={MEMORY_CHART_CONFIG}
                        isFullHeight
                        showYAxis
                        referenceLines={[
                          {
                            y: averageMemoryUsage,
                            label: 'average',
                            stroke: 'hsl(var(--foreground-default))',
                            strokeWidth: 1.5,
                          },
                        ]}
                        YAxisProps={{
                          width: 64,
                          tickFormatter: (value: number) => `${Number(value).toFixed(1)}MB`,
                        }}
                      />
                    </div>
                  </ChartContent>
                </ChartCard>
              </Chart>
            </div>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

function CodePage() {
  const initialFiles = useMemo(() => MOCK_CODE_FILES, [])
  const [files, setFiles] = useState<MockFileData[]>(initialFiles)
  const [selectedFileId, setSelectedFileId] = useState(initialFiles[0]?.id ?? 1)

  const selectedFile = files.find((file) => file.id === selectedFileId)

  const treeData = useMemo(
    () => ({
      name: '',
      children: files.map((file) => ({
        id: file.id.toString(),
        name: file.name,
        metadata: { originalId: file.id, state: file.state },
      })),
    }),
    [files]
  )

  const handleContentChange = (value: string) => {
    setFiles((currentFiles) =>
      currentFiles.map((file) => {
        if (file.id !== selectedFileId) return file

        const originalFile = initialFiles.find((item) => item.id === file.id)
        if (!originalFile) return { ...file, content: value, state: 'new' }
        if (originalFile.content !== value) return { ...file, content: value, state: 'modified' }
        return { ...file, content: value, state: 'unchanged' }
      })
    )
  }

  const addNewFile = () => {
    const newId = Math.max(0, ...files.map((file) => file.id)) + 1
    const newFile: MockFileData = {
      id: newId,
      name: `file-${newId}.ts`,
      content: '',
      state: 'new',
    }

    setFiles((currentFiles) => [...currentFiles, newFile])
    setSelectedFileId(newId)
  }

  const renderFileNode = useCallback(
    ({ element, isBranch, isExpanded, getNodeProps, level }: INodeRendererProps) => {
      const originalId =
        typeof element.metadata?.originalId === 'number' ? element.metadata.originalId : null
      const state = element.metadata?.state as MockFileData['state']

      return (
        <TreeViewItem
          {...getNodeProps()}
          isExpanded={isExpanded}
          isBranch={isBranch}
          isSelected={originalId === selectedFileId}
          level={level}
          xPadding={16}
          name={element.name}
          className={cn(
            state === 'new' ? 'text-brand-600' : state === 'modified' ? 'text-code_block-2' : ''
          )}
          icon={<File size={14} className="text-foreground-light shrink-0" />}
          onClick={() => {
            if (originalId !== null) setSelectedFileId(originalId)
          }}
          actions={
            state !== 'unchanged' && (
              <div className="flex items-center justify-center w-3">
                <Tooltip>
                  <TooltipTrigger className="text-xs">{state === 'new' ? 'U' : 'M'}</TooltipTrigger>
                  <TooltipContent side="bottom">
                    {state === 'new' ? 'Unsaved' : 'Modified'}
                  </TooltipContent>
                </Tooltip>
              </div>
            )
          }
        />
      )
    },
    [selectedFileId]
  )

  return (
    <div className="flex min-h-[480px] flex-col">
      <div className="flex flex-1 overflow-hidden bg-surface-100">
        <div className="flex min-w-64 w-64 flex-col border-r bg-surface-200">
          <div className="flex items-center justify-between border-b px-4 py-4">
            <h3 className="text-sm font-normal font-mono uppercase text-lighter tracking-wide">
              Files
            </h3>
            <Button size="tiny" variant="default" icon={<Plus size={14} />} onClick={addNewFile}>
              Add File
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <TreeView
              data={flattenTree(treeData)}
              aria-label="files tree"
              nodeRenderer={renderFileNode}
            />
          </div>
        </div>

        <div className="min-w-0 grow">
          {selectedFile ? (
            <textarea
              aria-label={`Edit ${selectedFile.name}`}
              className="h-full min-h-[420px] w-full resize-none border-0 bg-transparent px-5 py-5 font-mono text-[13px] leading-6 text-foreground focus:outline-none"
              spellCheck={false}
              value={selectedFile.content}
              onChange={(event) => handleContentChange(event.target.value)}
            />
          ) : (
            <div className="flex h-full min-h-[420px] items-center justify-center text-sm text-foreground-light">
              Select a file to edit
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end border-t bg-surface-100 p-4">
        <Button
          variant="primary"
          size="medium"
          iconRight={<CornerDownLeft size={10} strokeWidth={1.5} />}
        >
          Deploy updates
        </Button>
      </div>
    </div>
  )
}

function SettingsPage() {
  return (
    <>
      <PageHeader size="small" className="pb-12">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Settings</PageHeaderTitle>
            <PageHeaderDescription>
              Configure function behavior, security, and deployment options.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="small">
        <PageSection className="pt-0">
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Function configuration</PageSectionTitle>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <Card>
              <CardContent className="grid gap-4 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-sm text-foreground-light">
                      Your slug and endpoint URL will remain the same
                    </p>
                  </div>
                  <span className="font-mono text-sm">hello-world</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Verify JWT with legacy secret</p>
                    <p className="text-sm text-foreground-light">
                      Require a JWT signed by the legacy secret in the Authorization header.
                    </p>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
              </CardContent>
            </Card>
          </PageSectionContent>
        </PageSection>

        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Import map</PageSectionTitle>
              <PageSectionDescription>
                Control which import map this function uses at deploy time.
              </PageSectionDescription>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Import map</p>
                    <p className="text-sm text-foreground-light">Use the project import map.</p>
                  </div>
                  <Badge variant="default">Default</Badge>
                </div>
              </CardContent>
            </Card>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}
