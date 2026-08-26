import { fireEvent, screen } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { DestinationTypeSelection } from './DestinationTypeSelection'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ReplicationSourcesResponse = components['schemas']['SourcesResponse']
type ReplicationPipelinesResponse = components['schemas']['PipelinesResponse']
type ReplicationDestinationResponse = components['schemas']['DestinationResponse']

mockAnimationsApi()

// Feature flags are not API calls — mock at the module level so tests can
// control per-destination-type visibility without hitting PostHog.
const mockBigQueryEnabled = vi.fn()
const mockIcebergEnabled = vi.fn()
const mockDucklakeEnabled = vi.fn()
const mockSnowflakeEnabled = vi.fn()
const mockClickHouseEnabled = vi.fn()

vi.mock('../useIsETLPrivateAlpha', () => ({
  useIsETLBigQueryPrivateAlpha: () => mockBigQueryEnabled(),
  useIsETLIcebergPrivateAlpha: () => mockIcebergEnabled(),
  useIsETLDucklakePrivateAlpha: () => mockDucklakeEnabled(),
  useIsETLSnowflakePrivateAlpha: () => mockSnowflakeEnabled(),
  useIsETLClickHousePrivateAlpha: () => mockClickHouseEnabled(),
}))

const mockInfrastructureReadReplicas = vi.fn(() => true)

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => ({
    infrastructureReadReplicas: mockInfrastructureReadReplicas(),
  }),
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
  beforeEach(() => {
    mockInfrastructureReadReplicas.mockReturnValue(true)
    window.localStorage.clear()
  })

  test('shows placeholder when no type is selected', async () => {
    mockBigQueryEnabled.mockReturnValue(false)
    mockIcebergEnabled.mockReturnValue(false)
    mockDucklakeEnabled.mockReturnValue(false)
    mockSnowflakeEnabled.mockReturnValue(false)
    mockClickHouseEnabled.mockReturnValue(false)
    addBackgroundMocks()

    customRender(<DestinationTypeSelection />)

    expect(await screen.findByText('Select a destination type')).toBeInTheDocument()
  })

  test('renders the Pipelines group with BigQuery when the flag is enabled', async () => {
    mockBigQueryEnabled.mockReturnValue(true)
    mockIcebergEnabled.mockReturnValue(false)
    mockDucklakeEnabled.mockReturnValue(false)
    mockSnowflakeEnabled.mockReturnValue(false)
    mockClickHouseEnabled.mockReturnValue(false)
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
    mockClickHouseEnabled.mockReturnValue(false)
    addBackgroundMocks()

    customRender(<DestinationTypeSelection />)

    fireEvent.click(await screen.findByRole('combobox'))

    expect(screen.queryByText('Read Replica')).not.toBeInTheDocument()
    expect(screen.queryByText('BigQuery')).not.toBeInTheDocument()
    expect(screen.queryByText('DuckLake')).not.toBeInTheDocument()
    expect(screen.queryByText('Analytics Bucket')).not.toBeInTheDocument()
    expect(screen.queryByText('Pipelines')).not.toBeInTheDocument()
  })

  test('shows the public alpha warning for a Pipelines destination', async () => {
    mockBigQueryEnabled.mockReturnValue(true)
    mockIcebergEnabled.mockReturnValue(false)
    mockDucklakeEnabled.mockReturnValue(false)
    mockSnowflakeEnabled.mockReturnValue(false)
    mockClickHouseEnabled.mockReturnValue(false)
    addBackgroundMocks()

    customRender(<DestinationTypeSelection />)

    fireEvent.click(await screen.findByRole('combobox'))
    fireEvent.click(await screen.findByText('BigQuery'))

    expect(await screen.findByText(/In public alpha and may change/)).toBeInTheDocument()
  })

  test('disables the selector in edit mode so the destination type cannot be changed', async () => {
    mockBigQueryEnabled.mockReturnValue(true)
    mockIcebergEnabled.mockReturnValue(false)
    mockDucklakeEnabled.mockReturnValue(false)
    mockSnowflakeEnabled.mockReturnValue(false)
    mockClickHouseEnabled.mockReturnValue(false)
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
              connection_pool_size: 5,
            },
          },
        }),
    })

    // ?edit=1 locks the type to the existing destination
    customRender(<DestinationTypeSelection />, { nuqs: { searchParams: { edit: '1' } } })

    expect(await screen.findByRole('combobox')).toBeDisabled()
    expect(screen.queryByText('Read replicas have moved')).not.toBeInTheDocument()
  })

  test('shows a callout pointing read replicas to Infrastructure in create mode', async () => {
    mockBigQueryEnabled.mockReturnValue(false)
    mockIcebergEnabled.mockReturnValue(false)
    mockDucklakeEnabled.mockReturnValue(false)
    mockSnowflakeEnabled.mockReturnValue(false)
    mockClickHouseEnabled.mockReturnValue(false)
    mockInfrastructureReadReplicas.mockReturnValue(true)
    addBackgroundMocks()

    customRender(<DestinationTypeSelection />)

    expect(await screen.findByText('Read replicas have moved')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to Infrastructure' })).toHaveAttribute(
      'href',
      expect.stringContaining('/settings/infrastructure')
    )
  })

  test('hides the read replicas callout when Infrastructure read replicas are disabled', async () => {
    mockBigQueryEnabled.mockReturnValue(false)
    mockIcebergEnabled.mockReturnValue(false)
    mockDucklakeEnabled.mockReturnValue(false)
    mockSnowflakeEnabled.mockReturnValue(false)
    mockClickHouseEnabled.mockReturnValue(false)
    mockInfrastructureReadReplicas.mockReturnValue(false)
    addBackgroundMocks()

    customRender(<DestinationTypeSelection />)

    expect(await screen.findByText('Select a destination type')).toBeInTheDocument()
    expect(screen.queryByText('Read replicas have moved')).not.toBeInTheDocument()
  })
})
