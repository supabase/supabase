import { QueryClient } from '@tanstack/react-query'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { toast } from 'sonner'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { WarehouseOverviewTab } from './OverviewTab'
import { warehouseKeys } from '@/data/warehouse/keys'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type WarehouseSetupStatusResponse = components['schemas']['WarehouseSetupStatusResponse_Output']
type WarehouseSetupResponse = components['schemas']['WarehouseSetupResponse_Output']

// Both integration shells are live, and the flag reads a context plus ConfigCat that
// `customRender` doesn't provide.
const mockIsMarketplaceEnabled = vi.fn(() => false)
const mockTrack = vi.fn()
vi.mock('@/components/interfaces/App/FeaturePreview/FeaturePreviewContext', () => ({
  useIsMarketplaceEnabled: () => mockIsMarketplaceEnabled(),
}))
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => mockTrack }))

vi.mock('../Integration/IntegrationOverviewTab', () => ({
  IntegrationOverviewTab: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// Exercised by its own unit tests, and it fires four upstream queries of its own.
vi.mock('./WarehouseSchemaTablePicker', () => ({
  WarehouseSchemaTablePicker: ({
    error,
    isEditing,
    onSubmit,
  }: {
    error?: { message: string } | null
    isEditing?: boolean
    onSubmit: (targets: [{ type: 'table'; schema: string; name: string }]) => void
  }) => (
    <section>
      <h2>Tables</h2>
      <span>Replicated tables picker</span>
      {!!error && <span>Picker error: {error.message}</span>}
      <button
        tabIndex={0}
        onClick={() => onSubmit([{ type: 'table', schema: 'public', name: 'orders' }])}
      >
        {isEditing ? 'Submit edited tables' : 'Submit initial tables'}
      </button>
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
    mockTrack.mockClear()
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

  test('shows the latest error when retrying setup fails', async () => {
    mockProject()
    mockSetupStatus({
      setup_status: 'error',
      steps: [{ name: 'warehouse_copy', status: 'error', message: 'Initial setup failed' }],
      tables: [{ schema: 'public', name: 'orders', copy_name: 'public.orders', state: 'error' }],
    })
    addAPIMock({
      method: 'post',
      path: '/platform/warehouse/:ref/setup',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Retry could not be started' }, { status: 500 }),
    })

    customRender(<WarehouseOverviewTab />)

    await userEvent.click(await screen.findByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('Retry could not be started')).toBeInTheDocument()
    expect(screen.queryByText('Initial setup failed')).not.toBeInTheDocument()
  })

  test('shows Status, Tables, Connect, then Disable once setup is complete', async () => {
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
    for (const name of ['Status', 'Tables', 'Connect', 'Disable']) {
      expect(await screen.findByRole('heading', { name })).toBeInTheDocument()
    }
    expect(screen.getByText('Replicated tables picker')).toBeInTheDocument()
    expect(screen.getByText('Synced')).toBeInTheDocument()
    expect(screen.getByText('Backfilling')).toBeInTheDocument()
    expect(screen.getByText('Error')).toBeInTheDocument()

    const headings = screen
      .getAllByRole('heading')
      .map((heading) => heading.textContent)
      .filter((heading) => ['Status', 'Tables', 'Connect', 'Disable'].includes(heading ?? ''))

    expect(headings).toEqual(['Status', 'Tables', 'Connect', 'Disable'])
  })

  test('tracks initial setup but not table selection edits as enablement', async () => {
    mockSetupStatus({ setup_status: 'not_started' })
    addAPIMock({
      method: 'post',
      path: '/platform/warehouse/:ref/setup',
      response: () => HttpResponse.json<WarehouseSetupResponse>({ pipeline_id: 1, tables: [] }),
    })

    customRender(<WarehouseOverviewTab />)

    await userEvent.click(await screen.findByRole('button', { name: 'Submit initial tables' }))
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith('warehouse_enabled', {
        source: 'integrations_overview',
        schemaTargetCount: 0,
        tableTargetCount: 1,
      })
    )
  })

  test('does not track an edited table selection as enablement', async () => {
    mockSetupStatus({ setup_status: 'complete' })
    addAPIMock({
      method: 'post',
      path: '/platform/warehouse/:ref/setup',
      response: () => HttpResponse.json<WarehouseSetupResponse>({ pipeline_id: 1, tables: [] }),
    })

    customRender(<WarehouseOverviewTab />)

    await userEvent.click(await screen.findByRole('button', { name: 'Submit edited tables' }))
    await waitFor(() => expect(screen.getByText('Replicated tables picker')).toBeInTheDocument())
    expect(mockTrack).not.toHaveBeenCalledWith('warehouse_enabled', expect.anything())
  })

  test.each([false, true])(
    'disables Warehouse with delete_data=%s after confirmation',
    async (deleteData) => {
      mockSetupStatus({ setup_status: 'complete' })
      const requests: Array<string | null> = []
      addAPIMock({
        method: 'delete',
        path: '/platform/warehouse/:ref',
        response: ({ request }) => {
          requests.push(new URL(request.url).searchParams.get('delete_data'))
          return HttpResponse.json<undefined>(undefined, { status: 202 })
        },
      })

      customRender(<WarehouseOverviewTab />)

      await userEvent.click(await screen.findByRole('button', { name: 'Disable Warehouse' }))
      expect(requests).toEqual([])
      const dialog = await screen.findByRole('dialog')
      const checkbox = within(dialog).getByRole('checkbox', { name: 'Delete DuckLake data' })
      expect(checkbox).not.toBeChecked()
      expect(dialog).toHaveTextContent('Copied data and catalog metadata will be retained.')
      if (deleteData) {
        await userEvent.click(checkbox)
        expect(dialog).toHaveTextContent(
          'entire Storage bucket, including all objects. This cannot be undone.'
        )
      }
      fireEvent.click(
        within(dialog).getByRole('button', {
          name: deleteData ? 'Disable and delete data' : 'Disable Warehouse',
        })
      )

      expect(await screen.findByText('Disabling Warehouse')).toBeInTheDocument()
      expect(requests).toEqual([String(deleteData)])
      expect(screen.queryByText('Replicated tables picker')).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Connect' })).not.toBeInTheDocument()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(toast.success).toHaveBeenCalledWith('Warehouse disable started')
      expect(mockTrack).toHaveBeenCalledWith('warehouse_disabled', {})
    }
  )

  test('resets the destructive option when the confirmation is cancelled', async () => {
    mockSetupStatus({ setup_status: 'complete' })
    customRender(<WarehouseOverviewTab />)

    await userEvent.click(await screen.findByRole('button', { name: 'Disable Warehouse' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Delete DuckLake data' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await userEvent.click(screen.getByRole('button', { name: 'Disable Warehouse' }))

    expect(screen.getByRole('checkbox', { name: 'Delete DuckLake data' })).not.toBeChecked()
  })

  test('keeps the deletion choice and confirmation open when DELETE fails', async () => {
    mockSetupStatus({ setup_status: 'complete' })
    const requests: Array<string | null> = []
    addAPIMock({
      method: 'delete',
      path: '/platform/warehouse/:ref',
      response: ({ request }) => {
        requests.push(new URL(request.url).searchParams.get('delete_data'))
        if (requests.length === 1) {
          return HttpResponse.json<APIErrorBody>(
            { message: 'Disable request failed' },
            { status: 500 }
          )
        }
        return HttpResponse.json<undefined>(undefined, { status: 202 })
      },
    })

    customRender(<WarehouseOverviewTab />)

    await userEvent.click(await screen.findByRole('button', { name: 'Disable Warehouse' }))
    const dialog = await screen.findByRole('dialog')
    const checkbox = within(dialog).getByRole('checkbox', { name: 'Delete DuckLake data' })
    await userEvent.click(checkbox)
    const confirm = within(dialog).getByRole('button', { name: 'Disable and delete data' })
    fireEvent.click(confirm)

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to disable Warehouse: Disable request failed'
      )
    )
    expect(dialog).toBeVisible()
    expect(confirm).toBeEnabled()
    expect(checkbox).toBeChecked()
    fireEvent.click(confirm)

    expect(await screen.findByText('Disabling Warehouse')).toBeInTheDocument()
    expect(requests).toEqual(['true', 'true'])
  })

  test.each([false, true])(
    'polls cleanup until disabled, then allows setup (delete_data=%s)',
    async (deleteData) => {
      let isDisabled = false
      addAPIMock({
        method: 'get',
        path: '/platform/warehouse/:ref/setup-status',
        response: () =>
          HttpResponse.json<WarehouseSetupStatusResponse>({
            setup_status: isDisabled ? 'disabled' : 'disabling',
            delete_data: deleteData,
            fdw_status: null,
            steps: [],
            tables: [],
          }),
      })

      customRender(<WarehouseOverviewTab />)

      expect(await screen.findByText('Disabling Warehouse')).toBeInTheDocument()
      expect(screen.queryByText('Replicated tables picker')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Disable Warehouse' })).not.toBeInTheDocument()
      isDisabled = true
      expect(
        await screen.findByText('Replicated tables picker', {}, { timeout: 6000 })
      ).toBeInTheDocument()
      expect(screen.queryByText('Disabling Warehouse')).not.toBeInTheDocument()
      expect(screen.getByText('Warehouse disabled')).toBeInTheDocument()
      expect(
        screen.getByText(
          deleteData
            ? 'DuckLake data and catalog metadata have been deleted. You can set up Warehouse again.'
            : 'Copied data and catalog metadata have been retained. You can enable Warehouse again.'
        )
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Submit initial tables' })).toBeInTheDocument()
    },
    8000
  )

  test.each([false, true])(
    'retries failed cleanup with its original delete_data=%s',
    async (deleteData) => {
      mockProject()
      mockSetupStatus({
        setup_status: 'deletion_failed',
        delete_data: deleteData,
        error: 'Cleanup interrupted',
        fdw_status: null,
      })
      const requests: Array<string | null> = []
      addAPIMock({
        method: 'delete',
        path: '/platform/warehouse/:ref',
        response: ({ request }) => {
          requests.push(new URL(request.url).searchParams.get('delete_data'))
          return HttpResponse.json<undefined>(undefined, { status: 202 })
        },
      })

      customRender(<WarehouseOverviewTab />)

      expect(await screen.findByText('Warehouse cleanup failed')).toBeInTheDocument()
      expect(screen.getByText('Cleanup interrupted')).toBeInTheDocument()
      expect(screen.queryByText('Replicated tables picker')).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Connect' })).not.toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: 'Retry cleanup' }))
      expect(await screen.findByText('Disabling Warehouse')).toBeInTheDocument()
      expect(requests).toEqual([String(deleteData)])
    }
  )

  test('cancels an older status request before showing accepted cleanup', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const pendingStatus = Promise.withResolvers<void>()
    const statusStarted = Promise.withResolvers<void>()
    let statusRequests = 0
    addAPIMock({
      method: 'get',
      path: '/platform/warehouse/:ref/setup-status',
      response: async () => {
        statusRequests += 1
        if (statusRequests > 1) {
          statusStarted.resolve()
          await pendingStatus.promise
        }
        return HttpResponse.json<WarehouseSetupStatusResponse>({
          setup_status: 'complete',
          fdw_status: FDW_STATUS,
          steps: [],
          tables: [],
        })
      },
    })
    addAPIMock({
      method: 'delete',
      path: '/platform/warehouse/:ref',
      response: () => HttpResponse.json<undefined>(undefined, { status: 202 }),
    })
    customRender(<WarehouseOverviewTab />, { queryClient })
    await userEvent.click(await screen.findByRole('button', { name: 'Disable Warehouse' }))
    const previousRequest = queryClient.invalidateQueries({
      queryKey: warehouseKeys.setupStatus('default'),
    })
    await statusStarted.promise
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Disable Warehouse' })
    )
    expect(await screen.findByText('Disabling Warehouse')).toBeInTheDocument()
    await act(async () => {
      pendingStatus.resolve()
      await previousRequest
    })
    expect(
      queryClient.getQueryData<WarehouseSetupStatusResponse>(warehouseKeys.setupStatus('default'))
        ?.setup_status
    ).toBe('disabling')
    expect(screen.queryByText('Replicated tables picker')).not.toBeInTheDocument()
    queryClient.clear()
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
