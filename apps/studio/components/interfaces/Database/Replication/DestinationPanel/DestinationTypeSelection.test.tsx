import { fireEvent, screen } from '@testing-library/react'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { DestinationTypeSelection } from './DestinationTypeSelection'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()

// Same reason as DestinationRow — the background queries this component triggers
// via useDestinationInformation use checkReplicationFeatureFlagRetry, which retries
// on non-503 errors and would block test teardown.
vi.mock('../useIsETLPrivateAlpha', () => ({
  useIsETLBigQueryPrivateAlpha: () => mockBigQueryEnabled(),
  useIsETLIcebergPrivateAlpha: () => mockIcebergEnabled(),
  useIsETLDucklakePrivateAlpha: () => mockDucklakeEnabled(),
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => ({ infrastructureReadReplicas: true }),
}))

vi.mock('@/data/replication/utils', () => ({
  checkReplicationFeatureFlagRetry: () => false,
}))

// Declared after vi.mock hoisting — factory closures can reference these because
// vi.mock is hoisted to the top of the file at runtime, but the variables are
// accessible via closure by the time the factory executes.
const mockBigQueryEnabled = vi.fn()
const mockIcebergEnabled = vi.fn()
const mockDucklakeEnabled = vi.fn()

beforeEach(() => {
  // Default: all external-destination flags off, read replicas on (via useIsFeatureEnabled mock)
  mockBigQueryEnabled.mockReturnValue(false)
  mockIcebergEnabled.mockReturnValue(false)
  mockDucklakeEnabled.mockReturnValue(false)

  // Background queries fired by useDestinationInformation (edit === null → id is null,
  // so destination query is disabled; sources and pipelines still fire)
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: () => HttpResponse.json({ sources: [] }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines',
    response: () => HttpResponse.json({ pipelines: [] }),
  })
})

describe('DestinationTypeSelection', () => {
  test('shows placeholder when no type is selected', async () => {
    customRender(<DestinationTypeSelection />)

    expect(await screen.findByText('Select a destination type')).toBeInTheDocument()
  })

  test('renders the Within Supabase group with Read Replica when dropdown is opened', async () => {
    customRender(<DestinationTypeSelection />)

    fireEvent.click(await screen.findByRole('combobox'))

    expect(await screen.findByText('Within Supabase')).toBeInTheDocument()
    expect(screen.getByText('Read Replica')).toBeInTheDocument()
  })

  test('renders the Outside Supabase group with BigQuery when the flag is enabled', async () => {
    mockBigQueryEnabled.mockReturnValue(true)
    customRender(<DestinationTypeSelection />)

    fireEvent.click(await screen.findByRole('combobox'))

    expect(await screen.findByText('Outside Supabase')).toBeInTheDocument()
    expect(screen.getByText('BigQuery')).toBeInTheDocument()
  })

  test('hides destinations behind disabled feature flags', async () => {
    // All ETL flags off — only Read Replica should appear
    customRender(<DestinationTypeSelection />)

    fireEvent.click(await screen.findByRole('combobox'))

    await screen.findByText('Within Supabase')
    expect(screen.queryByText('BigQuery')).not.toBeInTheDocument()
    expect(screen.queryByText('DuckLake')).not.toBeInTheDocument()
    expect(screen.queryByText('Analytics Bucket')).not.toBeInTheDocument()
    expect(screen.queryByText('Outside Supabase')).not.toBeInTheDocument()
  })

  test('shows alpha warning when an alpha destination type is selected', async () => {
    mockBigQueryEnabled.mockReturnValue(true)
    customRender(<DestinationTypeSelection />)

    fireEvent.click(await screen.findByRole('combobox'))
    fireEvent.click(await screen.findByText('BigQuery'))

    expect(await screen.findByText(/This destination type is in alpha/)).toBeInTheDocument()
  })

  test('disables the selector in edit mode so the destination type cannot be changed', async () => {
    mockBigQueryEnabled.mockReturnValue(true)

    // Edit mode triggers useDestinationInformation({ id: 1 }) which fires the destination-by-id query
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/destinations/:destination_id',
      response: () =>
        HttpResponse.json({
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

    // ?edit=1 puts the component into edit mode — type is locked to the existing destination
    customRender(<DestinationTypeSelection />, { nuqs: { searchParams: { edit: '1' } } })

    expect(await screen.findByRole('combobox')).toBeDisabled()
  })
})
