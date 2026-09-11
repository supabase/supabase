import { screen } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { WarehouseOverviewTab } from './OverviewTab'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type WarehouseSetupStatusResponse = components['schemas']['WarehouseSetupStatusResponse']

// Both integration shells are live, and the flag reads a context plus ConfigCat that
// `customRender` doesn't provide.
const mockIsMarketplaceEnabled = vi.fn(() => false)
vi.mock('@/components/interfaces/App/FeaturePreview/FeaturePreviewContext', () => ({
  useIsMarketplaceEnabled: () => mockIsMarketplaceEnabled(),
}))

vi.mock('../Integration/IntegrationOverviewTab', () => ({
  IntegrationOverviewTab: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Exercised by its own unit tests, and it fires four upstream queries of its own.
vi.mock('./WarehouseSchemaTablePicker', () => ({
  WarehouseSchemaTablePicker: ({ error }: { error?: { message: string } | null }) => (
    <section>
      <h2>Tables</h2>
      <span>Replicated tables picker</span>
      {!!error && <span>Picker error: {error.message}</span>}
    </section>
  ),
}))

mockAnimationsApi()
dayjs.extend(duration)

const FDW_STATUS: WarehouseSetupStatusResponse['fdw_status'] = {
  extension_available: true,
  extension_installed: true,
  foreign_schema_imported: true,
  schema_created: true,
  server_configured: true,
  wrapper_installed: true,
}

const mockSetupStatus = (status: Partial<WarehouseSetupStatusResponse>) =>
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/setup-status',
    response: () =>
      HttpResponse.json<WarehouseSetupStatusResponse>({
        fdw_status: FDW_STATUS,
        setup_status: 'not_started',
        steps: [],
        tables: [],
        ...status,
      }),
  })

const mockProject = () =>
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    // @ts-expect-error partial project response used by AlertError
    response: {
      cloud_provider: 'localhost',
      id: 1,
      inserted_at: '2021-08-02T06:40:40.646Z',
      name: 'Default Project',
      organization_id: 1,
      ref: 'default',
      region: 'local',
      status: 'ACTIVE_HEALTHY',
    },
  })

describe('WarehouseOverviewTab', () => {
  beforeEach(() => {
    mockIsMarketplaceEnabled.mockReturnValue(true)
  })

  test.each([false, true])(
    'offers only the picker before setup (marketplace: %s)',
    async (isMarketplaceEnabled) => {
      mockIsMarketplaceEnabled.mockReturnValue(isMarketplaceEnabled)
      mockSetupStatus({ setup_status: 'not_started' })

      customRender(<WarehouseOverviewTab />)

      expect(await screen.findByText('Replicated tables picker')).toBeInTheDocument()
      expect(screen.queryByText('External access')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Disable Warehouse' })).not.toBeInTheDocument()
    }
  )

  test.each(['setting_up', 'copying'] as const)(
    'shows setup progress for %s',
    async (setupStatus) => {
      mockSetupStatus({
        setup_status: setupStatus,
        tables:
          setupStatus === 'copying'
            ? [
                { schema: 'public', name: 'orders', copy_name: 'public.orders', state: 'live' },
                {
                  schema: 'public',
                  name: 'customers',
                  copy_name: 'public.customers',
                  state: 'syncing',
                },
              ]
            : [],
      })

      customRender(<WarehouseOverviewTab />)

      expect(await screen.findByText('Warehouse is being set up')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Status' })).toBeInTheDocument()
      if (setupStatus === 'copying') {
        expect(
          screen.getByText('Backfilling selected tables. 1 of 2 tables synced.')
        ).toBeInTheDocument()
        expect(screen.getByText('orders')).toBeInTheDocument()
        expect(screen.getByText('customers')).toBeInTheDocument()
      }
    }
  )

  test('shows the setup failure and retry action', async () => {
    mockProject()
    mockSetupStatus({
      setup_status: 'error',
      steps: [{ name: 'warehouse_copy', status: 'error', message: 'Failed to copy public.orders' }],
      tables: [{ schema: 'public', name: 'orders', copy_name: 'public.orders', state: 'error' }],
    })

    customRender(<WarehouseOverviewTab />)

    expect(await screen.findByText('Warehouse setup failed')).toBeInTheDocument()
    expect(screen.getByText('Failed to copy public.orders')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  test('shows Status, Tables, then Connect once setup is complete', async () => {
    mockSetupStatus({
      setup_status: 'complete',
      tables: [
        {
          schema: 'public',
          name: 'orders',
          copy_name: 'public.orders',
          state: 'live',
          lag_ms: 4000,
        },
        {
          schema: 'public',
          name: 'customers',
          copy_name: 'public.customers',
          state: 'syncing',
          lag_ms: 18000,
        },
        { schema: 'analytics', name: 'events', copy_name: 'analytics.events', state: 'error' },
      ],
    })

    customRender(<WarehouseOverviewTab />)

    // findByRole throws on duplicates, so this also guards the section titles staying distinct.
    for (const name of ['Status', 'Tables', 'Connect']) {
      expect(await screen.findByRole('heading', { name })).toBeInTheDocument()
    }
    expect(screen.getByText('Replicated tables picker')).toBeInTheDocument()
    expect(screen.getByText('Synced')).toBeInTheDocument()
    expect(screen.getByText('Backfilling')).toBeInTheDocument()
    expect(screen.getByText('Error')).toBeInTheDocument()

    const headings = screen
      .getAllByRole('heading')
      .map((heading) => heading.textContent)
      .filter((heading) => ['Status', 'Tables', 'Connect'].includes(heading ?? ''))

    expect(headings).toEqual(['Status', 'Tables', 'Connect'])
    expect(screen.queryByRole('button', { name: 'Disable Warehouse' })).not.toBeInTheDocument()
  })

  test('shows a status query failure without blocking an unrelated route', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/warehouse/:ref/setup-status',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Boom' }, { status: 500 }),
    })
    mockProject()

    customRender(<WarehouseOverviewTab />)

    expect(await screen.findByText('Failed to load Warehouse status')).toBeInTheDocument()
  })
})
