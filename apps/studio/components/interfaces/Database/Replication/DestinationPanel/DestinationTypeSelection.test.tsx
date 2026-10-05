import { fireEvent, screen, within } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { DestinationTypeSelection } from './DestinationTypeSelection'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ReplicationSourcesResponse = components['schemas']['SourcesResponse_Output']
type ReplicationPipelinesResponse = components['schemas']['PipelinesResponse_Output']
type ReplicationDestinationResponse = components['schemas']['DestinationResponse_Output']

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
    window.localStorage.clear()
    mockBigQueryEnabled.mockReturnValue(false)
    mockIcebergEnabled.mockReturnValue(false)
    mockDucklakeEnabled.mockReturnValue(false)
    mockSnowflakeEnabled.mockReturnValue(false)
    mockClickHouseEnabled.mockReturnValue(false)
    addBackgroundMocks()
  })

  test('shows placeholder when no type is selected', async () => {
    customRender(<DestinationTypeSelection />)

    expect(await screen.findByText('Select a destination type')).toBeInTheDocument()
  })

  test('groups destinations by release stage', async () => {
    mockBigQueryEnabled.mockReturnValue(true)
    mockIcebergEnabled.mockReturnValue(true)
    mockDucklakeEnabled.mockReturnValue(true)
    mockSnowflakeEnabled.mockReturnValue(true)
    mockClickHouseEnabled.mockReturnValue(true)

    customRender(<DestinationTypeSelection />)

    fireEvent.click(await screen.findByRole('combobox'))

    const publicAlphaGroup = await screen.findByRole('group', { name: 'Public Alpha' })
    expect(screen.queryByText('Early Access')).not.toBeInTheDocument()
    expect(screen.getByText('Deprecated')).toBeInTheDocument()
    for (const destination of ['BigQuery', 'ClickHouse', 'DuckLake', 'Snowflake']) {
      expect(within(publicAlphaGroup).getByText(destination)).toBeInTheDocument()
    }
    expect(screen.getByText('Analytics Bucket')).toBeInTheDocument()
  })

  test('hides destinations behind disabled feature flags', async () => {
    customRender(<DestinationTypeSelection />)

    fireEvent.click(await screen.findByRole('combobox'))

    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  test.each(['BigQuery', 'ClickHouse', 'DuckLake', 'Snowflake'])(
    'shows the public alpha warning for %s',
    async (destination) => {
      mockBigQueryEnabled.mockReturnValue(true)
      mockDucklakeEnabled.mockReturnValue(true)
      mockSnowflakeEnabled.mockReturnValue(true)
      mockClickHouseEnabled.mockReturnValue(true)

      customRender(<DestinationTypeSelection />)

      fireEvent.click(await screen.findByRole('combobox'))
      fireEvent.click(await screen.findByText(destination))

      expect(
        await screen.findByText(
          `Destination type cannot be changed after creation. ${destination} support is in public alpha.`
        )
      ).toBeInTheDocument()
    }
  )

  test('disables the selector in edit mode so the destination type cannot be changed', async () => {
    mockBigQueryEnabled.mockReturnValue(true)
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
  })
})
