import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ComputeAndDiskUsageCharts } from './ComputeAndDiskUsageCharts'
import type { InfraMonitoringMultiResponse } from '@/data/analytics/infra-monitoring-query'

const { mockGetInfraMonitoringAttributes, mockUseInfraMonitoringAttributesQuery, mockUseProject } =
  vi.hoisted(() => ({
    mockGetInfraMonitoringAttributes: vi.fn(),
    mockUseInfraMonitoringAttributesQuery: vi.fn(),
    mockUseProject: vi.fn(),
  }))

vi.mock('common', () => ({
  useParams: () => ({ ref: 'project-ref' }),
}))

vi.mock('ui', () => ({
  cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' '),
}))

vi.mock('ui-patterns/Chart', async () => {
  const React = await vi.importActual<typeof import('react')>('react')
  const ChartStateContext = React.createContext({ isLoading: false, isErrored: false })

  return {
    Chart: ({
      children,
      isLoading,
      isErrored,
    }: {
      children: ReactNode
      isLoading: boolean
      isErrored: boolean
    }) => (
      <ChartStateContext.Provider value={{ isLoading, isErrored }}>
        {children}
      </ChartStateContext.Provider>
    ),
    ChartCard: ({ children, className }: { children: ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
    ChartContent: ({
      children,
      isEmpty,
      loadingState,
      errorState,
      emptyState,
    }: {
      children: ReactNode
      isEmpty: boolean
      loadingState: ReactNode
      errorState: ReactNode
      emptyState: ReactNode
    }) => {
      const { isLoading, isErrored } = React.useContext(ChartStateContext)

      if (isLoading) return loadingState
      if (isErrored) return errorState
      if (isEmpty) return emptyState
      return children
    },
    ChartEmptyState: ({ title, description }: { title: string; description?: string }) => (
      <div>
        <span>{title}</span>
        {description && <span>{description}</span>}
      </div>
    ),
    ChartHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    ChartLine: ({ dataKey, dataKeys }: { dataKey: string; dataKeys: string[] }) => (
      <div data-testid={`chart-line-${dataKey}`} data-keys={dataKeys.join(',')} />
    ),
    ChartLoadingState: () => <div>Loading chart</div>,
    ChartMetric: ({
      label,
      value,
      status,
      tooltip,
    }: {
      label: string
      value: ReactNode
      status?: string
      tooltip?: ReactNode
    }) => (
      <div
        data-testid={`metric-${label}`}
        data-status={status}
        data-has-tooltip={tooltip !== undefined}
      >
        {label}: {value}
      </div>
    ),
  }
})

vi.mock('@/data/analytics/infra-monitoring-query', () => ({
  getInfraMonitoringAttributes: mockGetInfraMonitoringAttributes,
  useInfraMonitoringAttributesQuery: mockUseInfraMonitoringAttributesQuery,
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: mockUseProject,
}))

vi.mock('@/lib/helpers', () => ({
  formatBytes: (bytes: number) => `${bytes} bytes`,
}))

const buildUsageResponse = ({
  cpu = 40,
  memory = 50,
  diskIo = 60,
  database = 40,
  wal = 5,
  system = 5,
  diskSize = 100,
}: {
  cpu?: number
  memory?: number
  diskIo?: number
  database?: number
  wal?: number
  system?: number
  diskSize?: number
} = {}): InfraMonitoringMultiResponse => ({
  series: {},
  data: [
    {
      period_start: '2026-07-20T00:00:00.000Z',
      values: {
        max_cpu_usage: String(cpu),
        ram_usage: String(memory),
        disk_io_consumption: String(diskIo),
        pg_database_size: String(database),
        disk_fs_used_wal: String(wal),
        disk_fs_used_system: String(system),
        disk_fs_size: String(diskSize),
      },
    },
  ],
})

describe('ComputeAndDiskUsageCharts', () => {
  beforeEach(() => {
    mockUseProject.mockReturnValue({ data: { infra_compute_size: 'micro' } })
    mockUseInfraMonitoringAttributesQuery.mockReturnValue({
      data: buildUsageResponse(),
      isLoading: false,
      isError: false,
    })
    mockGetInfraMonitoringAttributes.mockResolvedValue(buildUsageResponse())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders warning and critical summaries and all chart data', () => {
    mockUseInfraMonitoringAttributesQuery.mockReturnValue({
      data: buildUsageResponse({
        cpu: 80,
        memory: 91,
        diskIo: 70,
        database: 80,
        wal: 5,
        system: 5,
      }),
      isLoading: false,
      isError: false,
    })

    const { container } = render(<ComputeAndDiskUsageCharts />)

    expect(screen.getByTestId('metric-Compute')).toHaveTextContent('91%')
    expect(screen.getByTestId('metric-Compute')).toHaveAttribute('data-status', 'negative')
    expect(screen.getByTestId('metric-CPU')).toHaveAttribute('data-status', 'warning')
    expect(screen.getByTestId('metric-Memory')).toHaveAttribute('data-status', 'negative')
    expect(screen.getByTestId('metric-Disk IO')).toHaveAttribute('data-status', 'default')
    expect(screen.getByTestId('metric-Compute')).toHaveAttribute('data-has-tooltip', 'true')
    expect(screen.getByTestId('metric-Disk')).toHaveAttribute('data-has-tooltip', 'true')
    for (const label of ['CPU', 'Memory', 'Disk IO', 'Database', 'WAL', 'System']) {
      expect(screen.getByTestId(`metric-${label}`)).toHaveAttribute('data-has-tooltip', 'false')
    }
    expect(screen.getByTestId('metric-Disk')).toHaveTextContent('90%')
    expect(screen.getByTestId('metric-Disk')).toHaveAttribute('data-status', 'negative')
    expect(screen.getByTestId('chart-line-maxCpuUsage')).toHaveAttribute(
      'data-keys',
      'maxCpuUsage,ramUsage,diskIoConsumption'
    )
    expect(container.firstElementChild).toHaveClass(
      'grid-cols-1',
      '@[680px]:grid-cols-2',
      '@[680px]:items-stretch'
    )
    expect(container.querySelector('#cpu')).toBeInTheDocument()
    expect(container.querySelector('#ram')).toBeInTheDocument()
    expect(container.querySelector('#disk_io')).toBeInTheDocument()
    expect(container.querySelector('#disk')).toBeInTheDocument()
  })

  it('hides burst-only disk IO and excludes it from status on dedicated-I/O compute', () => {
    mockUseProject.mockReturnValue({ data: { infra_compute_size: '4xlarge' } })
    mockUseInfraMonitoringAttributesQuery.mockReturnValue({
      data: buildUsageResponse({ cpu: 40, memory: 50, diskIo: 95 }),
      isLoading: false,
      isError: false,
    })

    render(<ComputeAndDiskUsageCharts />)

    expect(screen.getByTestId('metric-Compute')).toHaveTextContent('50%')
    expect(screen.getByTestId('metric-Compute')).toHaveAttribute('data-status', 'default')
    expect(screen.queryByTestId('metric-Disk IO')).not.toBeInTheDocument()
    expect(screen.getByTestId('chart-line-maxCpuUsage')).toHaveAttribute(
      'data-keys',
      'maxCpuUsage,ramUsage'
    )
  })

  it('renders empty states without presenting missing disk metrics as zero', () => {
    mockUseInfraMonitoringAttributesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    })

    render(<ComputeAndDiskUsageCharts />)

    expect(screen.getByText('No compute data')).toBeInTheDocument()
    expect(screen.getByText('No disk data')).toBeInTheDocument()
    expect(screen.getByTestId('metric-Database')).toHaveTextContent('—')
    expect(screen.getByTestId('metric-WAL')).toHaveTextContent('—')
    expect(screen.getByTestId('metric-System')).toHaveTextContent('—')
  })

  it.each([
    {
      state: 'loading',
      queryState: { data: undefined, isLoading: true, isError: false },
      expectedText: 'Loading chart',
    },
    {
      state: 'error',
      queryState: { data: undefined, isLoading: false, isError: true },
      expectedText: 'Failed to load usage data',
    },
  ])('renders both $state states', ({ queryState, expectedText }) => {
    mockUseInfraMonitoringAttributesQuery.mockReturnValue(queryState)

    render(<ComputeAndDiskUsageCharts />)

    expect(screen.getAllByText(expectedText)).toHaveLength(2)
  })

  it('uses a fresh rolling seven-day window when the query refetches', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-20T12:00:00.000Z'))

    render(<ComputeAndDiskUsageCharts />)

    const [, options] = mockUseInfraMonitoringAttributesQuery.mock.calls[0]
    vi.setSystemTime(new Date('2026-07-27T12:00:00.000Z'))
    await options.queryFn({ signal: undefined })

    expect(mockGetInfraMonitoringAttributes).toHaveBeenCalledWith(
      expect.objectContaining({
        projectRef: 'project-ref',
        startDate: '2026-07-20T12:00:00.000Z',
        endDate: '2026-07-27T12:00:00.000Z',
        interval: '1d',
      }),
      undefined
    )
  })
})
