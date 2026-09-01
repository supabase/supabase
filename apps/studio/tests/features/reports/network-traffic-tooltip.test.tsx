import { fireEvent, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { test, vi } from 'vitest'

import { render } from '@/tests/helpers'

const networkTrafficTooltip =
  'Ingress and egress are measured from request and response logs and do not represent billable egress.'

const report = {
  addFilter: vi.fn(),
  data: {},
  error: {},
  filters: [],
  isLoading: false,
  mergeParams: vi.fn(),
  params: {},
  refresh: vi.fn(),
  removeFilters: vi.fn(),
}

vi.mock('@/components/interfaces/Reports/ReportFilterBar', () => ({ default: () => null }))
vi.mock('@/components/interfaces/Reports/ReportHeader', () => ({ default: () => null }))
vi.mock('@/components/interfaces/Reports/ReportPadding', () => ({
  ReportPadding: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/components/interfaces/Reports/ReportStickyNav', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/components/interfaces/Reports/renderers/ApiRenderers', () => ({
  ErrorCountsChartRenderer: () => null,
  NetworkTrafficRenderer: () => null,
  RequestsByCountryMapRenderer: () => null,
  ResponseSpeedChartRenderer: () => null,
  TopApiRoutesRenderer: () => null,
  TotalRequestsChartRenderer: () => null,
}))
vi.mock('@/components/interfaces/Reports/renderers/StorageRenderers', () => ({
  CacheHitRateChartRenderer: () => null,
  TopCacheMissesRenderer: () => null,
}))
vi.mock('@/components/interfaces/Settings/Logs/Logs.DatePickers', () => ({
  LogsDatePicker: () => null,
}))
vi.mock('@/components/interfaces/Settings/Logs/UpgradePrompt', () => ({ default: () => null }))
vi.mock('@/components/layouts/DefaultLayout', () => ({ DefaultLayout: () => null }))
vi.mock('@/components/layouts/ObservabilityLayout/ObservabilityLayout', () => ({ default: () => null }))
vi.mock('@/components/ui/DocsButton', () => ({ DocsButton: () => null }))
vi.mock('@/components/ui/ObservabilityLink', () => ({ ObservabilityLink: () => null }))
vi.mock('@/components/ui/ShortcutTooltip', () => ({
  ShortcutTooltip: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/data/reports/api-report-query', () => ({ useApiReport: () => report }))
vi.mock('@/data/reports/storage-report-query', () => ({ useStorageReport: () => report }))
vi.mock('@/hooks/misc/useReportDateRange', () => ({
  useRefreshHandler: () => vi.fn(),
  useReportDateRange: () => ({
    datePickerHelpers: [],
    datePickerValue: {},
    handleDatePickerChange: vi.fn(),
    setShowUpgradePrompt: vi.fn(),
    showUpgradePrompt: false,
  }),
}))
vi.mock('@/state/shortcuts/useShortcut', () => ({ useShortcut: () => undefined }))

const { SharedAPIReport } = await import(
  '@/components/interfaces/Reports/SharedAPIReport/SharedAPIReport'
)
const { ApiReport } = await import('@/pages/project/[ref]/observability/api-overview')
const { StorageReport } = await import('@/pages/project/[ref]/observability/storage')

const reportProps = {
  data: {},
  error: {},
  isLoading: {},
  isRefetching: false,
  sql: {
    errorCounts: '',
    networkTraffic: '',
    responseSpeed: '',
    totalRequests: '',
  },
}

const showNetworkTrafficTooltip = async () => {
  const title = screen.getByRole('heading', { name: 'Network Traffic' })
  const trigger = title.parentElement?.querySelector('button')

  expect(trigger).toBeTruthy()
  if (!trigger) throw new Error('Network Traffic tooltip trigger is missing')
  fireEvent.focus(trigger)

  expect(await screen.findByText(networkTrafficTooltip)).toBeVisible()
}

test.each([
  ['shared API report', <SharedAPIReport {...reportProps} />],
  ['API overview', <ApiReport />],
  ['Storage observability', <StorageReport />],
])('%s exposes the network traffic billing disclaimer', async (_, component) => {
  render(component)

  await showNetworkTrafficTooltip()
})
