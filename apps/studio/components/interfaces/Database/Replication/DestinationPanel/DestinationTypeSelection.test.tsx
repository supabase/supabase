import { fireEvent, screen } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { DestinationTypeSelection } from './DestinationTypeSelection'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ReplicationSourcesResponse = components['schemas']['ReplicationSourcesResponse']
type ReplicationPipelinesResponse = components['schemas']['ReplicationPipelinesResponse']
type ReplicationDestinationResponse = components['schemas']['ReplicationDestinationResponse']

mockAnimationsApi()

// Feature flags are not API calls — mock at the module level so tests can
// control per-destination-type visibility without hitting PostHog.
const mockBigQueryEnabled = vi.fn()
const mockIcebergEnabled = vi.fn()
const mockDucklakeEnabled = vi.fn()
const mockSnowflakeEnabled = vi.fn()

vi.mock('../useIsETLPrivateAlpha', () => ({
  useIsETLBigQueryPrivateAlpha: () => mockBigQueryEnabled(),
  useIsETLIcebergPrivateAlpha: () => mockIcebergEnabled(),
  useIsETLDucklakePrivateAlpha: () => mockDucklakeEnabled(),
  useIsETLSnowflakePrivateAlpha: () => mockSnowflakeEnabled(),
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => ({ infrastructureReadReplicas: true }),
}))

// Background queries from useDestinationInformation (sources + pipelines fire
// even in create mode). Prevent retries so unmatched handlers fail fast.
vi.mock('@/data/replication/utils', () => ({
  checkReplicationFeatureFlagRetry: () => false,
}))

const addBackgroundMocks = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: () => HttpResponse.json<ReplicationSourcesResponse>({ sources: [] }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines',
    response: () => HttpResponse.json<ReplicationPipelinesResponse>({ pipelines: [] }),
  })
}

describe('DestinationTypeSelection', () => {
  test('shows placeholder when no type is selected', async () => {
    mockBigQueryEnabled.mockReturnValue(false)
    mockIcebergEnabled.mockReturnValue(false)
    mockDucklakeEnabled.mockReturnValue(false)
    mockSnowflakeEnabled.mockReturnValue(false)
    addBackgroundMocks()

    customRender(<DestinationTypeSelection />)

    expect(await screen.findByText('Select a destination type')).toBeInTheDocument()
  })

  test('renders Read Replica in the Other group when dropdown is opened', async () => {
    mockBigQueryEnabled.mockReturnValue(false)
    mockIcebergEnabled.mockReturnValue(false)
    mockDucklakeEnabled.mockReturnValue(false)
    mockSnowflakeEnabled.mockReturnValue(false)
    addBackgroundMocks()

    customRender(<DestinationTypeSelection />)

    fireEvent.click(await screen.findByRole('combobox'))

    expect(await screen.findByText('Other')).toBeInTheDocument()
    expect(screen.getByText('Read Replica')).toBeInTheDocument()
  })

  test('renders the Pipelines group with BigQuery when the flag is enabled', async () => {
    mockBigQueryEnabled.mockReturnValue(true)
    mockIcebergEnabled.mockReturnValue(false)
    mockDucklakeEnabled.mockReturnValue(false)
    mockSnowflakeEnabled.mockReturnValue(false)
    addBackgroundMocks()

    customRender(<DestinationTypeSelection />)

    fireEvent.click(await screen.findByRole('combobox'))

    expect(await screen.findByText('Pipelines')).toBeInTheDocument()
    expect(screen.getByText('BigQuery')).toBeInTheDocument()
  })

  test('hides destinations behind disabled feature flags', async () => {
    mockBigQueryEnabled.mockReturnValue(false)
    mockIcebergEnabled.mockReturnValue(false)
    mockDucklakeEnabled.mockReturnValue(false)
    mockSnowflakeEnabled.mockReturnValue(false)
    addBackgroundMocks()

    customRender(<DestinationTypeSelection />)

    fireEvent.click(await screen.findByRole('combobox'))

    expect(await screen.findByText('Other')).toBeInTheDocument()
    expect(screen.getByText('Read Replica')).toBeInTheDocument()
    expect(screen.queryByText('BigQuery')).not.toBeInTheDocument()
    expect(screen.queryByText('DuckLake')).not.toBeInTheDocument()
    expect(screen.queryByText('Analytics Bucket')).not.toBeInTheDocument()
    expect(screen.queryByText('Pipelines')).not.toBeInTheDocument()
  })

  test('shows alpha warning when an alpha destination type is selected', async () => {
    mockBigQueryEnabled.mockReturnValue(true)
    mockIcebergEnabled.mockReturnValue(false)
    mockDucklakeEnabled.mockReturnValue(false)
    mockSnowflakeEnabled.mockReturnValue(false)
    addBackgroundMocks()

    customRender(<DestinationTypeSelection />)

    fireEvent.click(await screen.findByRole('combobox'))
    fireEvent.click(await screen.findByText('BigQuery'))

    expect(await screen.findByText(/This destination type is in alpha/)).toBeInTheDocument()
  })

  test('disables the selector in edit mode so the destination type cannot be changed', async () => {
    mockBigQueryEnabled.mockReturnValue(true)
    mockIcebergEnabled.mockReturnValue(false)
    mockDucklakeEnabled.mockReturnValue(false)
    mockSnowflakeEnabled.mockReturnValue(false)
    addBackgroundMocks()
    // Edit mode triggers useDestinationInformation({ id: 1 }) which fires destination-by-id
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/destinations/:destination_id',
      response: () =>
        HttpResponse.json<ReplicationDestinationResponse>({
          tenant_id: 't',
          id: 1,
          name: 'My BigQuery Destination',
          config: {
            big_query: {
              project_id: 'gcp-proj',
              dataset_id: 'analytics',
              service_account_key: '{}',
            },
          },
        }),
    })

    // ?edit=1 locks the type to the existing destination
    customRender(<DestinationTypeSelection />, { nuqs: { searchParams: { edit: '1' } } })

    expect(await screen.findByRole('combobox')).toBeDisabled()
  })
})
