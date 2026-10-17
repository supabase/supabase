import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { WarehouseTab } from './WarehouseTab'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type WarehouseSetupStatusResponse = components['schemas']['WarehouseSetupStatusResponse_Output']
type WarehouseCatalogResponse = components['schemas']['WarehouseCatalogResponse_Output']
type UpdateWarehouseCatalogBody = components['schemas']['UpdateWarehouseCatalogBody']

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

// Placeholder host and password, matching the fixtures in `lib/warehouse.test.ts`. A realistic
// `db.<ref>.supabase.co` host with a plausible password reads as a real credential to secret
// scanning.
const CATALOG_PASSWORD = 'pwd'
const CATALOG_URL = 'postgres://postgres:pwd@db.example.supabase.co:5432/postgres'

const mockCatalog = (catalog: WarehouseCatalogResponse) =>
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/catalog',
    response: () => HttpResponse.json<WarehouseCatalogResponse>(catalog),
  })

// The query engine selector is a Radix Select.
mockAnimationsApi()

describe('WarehouseTab', () => {
  test('points at the integration and shows no setup UI when Warehouse is not set up', async () => {
    mockSetupStatus({ setup_status: 'not_started' })

    customRender(<WarehouseTab />)

    expect(await screen.findByText('Warehouse is not set up')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Choose tables' })).toHaveAttribute(
      'href',
      '/project/default/integrations/warehouse/overview'
    )
    // The whole point of the split: Connect never provisions anything.
    expect(screen.queryByText('Endpoint')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Enable Warehouse/i })).not.toBeInTheDocument()
  })

  test('explains that setup is still running rather than showing empty connection details', async () => {
    mockSetupStatus({ setup_status: 'copying' })

    customRender(<WarehouseTab />)

    expect(await screen.findByText('Warehouse is being set up')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View progress' })).toBeInTheDocument()
  })

  test('shows connection details once the first table is live while setup continues', async () => {
    mockSetupStatus({
      setup_status: 'copying',
      tables: [
        { schema: 'public', name: 'orders', copy_name: 'public.orders', state: 'live' },
        { schema: 'public', name: 'customers', copy_name: 'public.customers', state: 'syncing' },
      ],
    })

    customRender(<WarehouseTab />)

    expect(await screen.findByText('Warehouse setup is still running')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Some tables are ready to query. The remaining tables will become available as their backfills finish.'
      )
    ).toBeInTheDocument()
    expect(screen.getByDisplayValue('default.warehouse.supabase.io')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View progress' })).toHaveAttribute(
      'href',
      '/project/default/integrations/warehouse/overview'
    )
  })

  test('points to the integration when setup reports an error', async () => {
    mockSetupStatus({
      setup_status: 'error',
      tables: [{ schema: 'public', name: 'orders', copy_name: 'public.orders', state: 'live' }],
    })

    customRender(<WarehouseTab />)

    expect(await screen.findByText('Warehouse setup failed')).toBeInTheDocument()
    expect(
      screen.getByText('Review the error and retry setup to get connection details.')
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Warehouse' })).toHaveAttribute(
      'href',
      '/project/default/integrations/warehouse/overview'
    )
    expect(screen.queryByDisplayValue('default.warehouse.supabase.io')).not.toBeInTheDocument()
  })

  test('renders connection details and offers catalog access only for DuckDB', async () => {
    mockSetupStatus({ setup_status: 'complete' })
    mockCatalog({ enabled: false })
    const onUrlUpdate = vi.fn()

    const { container } = customRender(<WarehouseTab />, {
      nuqs: { hasMemory: true, onUrlUpdate },
    })

    expect(await screen.findByRole('combobox', { name: 'Query engine' })).toBeInTheDocument()
    expect(container.querySelector('.border-0.shadow-none')).toBeInTheDocument()
    expect(container.querySelector('[data-orientation="horizontal"]')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Connect' })).not.toBeInTheDocument()
    expect(screen.getByDisplayValue('default.warehouse.supabase.io')).toBeInTheDocument()
    expect(
      screen.getByDisplayValue(
        'flightsql://postgres:[YOUR-PASSWORD]@default.warehouse.supabase.io:443?tls=enabled'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Manage Warehouse' })).toHaveAttribute(
      'href',
      '/project/default/integrations/warehouse/overview'
    )

    // FlightSQL is the default engine and needs no catalog access, so nothing here provisions.
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('combobox', { name: 'Query engine' }))
    await userEvent.click(screen.getByRole('option', { name: 'DuckDB' }))
    expect(
      await screen.findByRole('switch', { name: 'Enable DuckDB catalog access' })
    ).not.toBeChecked()
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ queryString: '?warehouseQueryEngine=duckdb' })
    )
  })

  test('hydrates the selected query engine from the URL', async () => {
    mockSetupStatus({ setup_status: 'complete' })
    mockCatalog({ enabled: false })

    customRender(<WarehouseTab />, {
      nuqs: { searchParams: { warehouseQueryEngine: 'duckdb' } },
    })

    expect(await screen.findByRole('combobox', { name: 'Query engine' })).toHaveTextContent(
      'DuckDB'
    )
    expect(
      await screen.findByRole('switch', { name: 'Enable DuckDB catalog access' })
    ).not.toBeChecked()
  })

  test('renders the DuckLake attach script when catalog access is on', async () => {
    mockSetupStatus({ setup_status: 'complete' })
    mockCatalog({
      enabled: true,
      credentials: {
        catalog_url: CATALOG_URL,
        data_path: 's3://warehouse/',
        metadata_schema: 'ducklake',
        s3_access_key_id: 'access-key-id',
        s3_endpoint: 'default.storage.supabase.co/storage/v1/s3',
        s3_region: 'ap-southeast-1',
        s3_secret_access_key: 's3-secret',
      },
    })

    customRender(<WarehouseTab />, { nuqs: { hasMemory: true } })

    await userEvent.click(await screen.findByRole('combobox', { name: 'Query engine' }))
    await userEvent.click(await screen.findByRole('option', { name: 'DuckDB' }))

    expect(
      await screen.findByRole('switch', { name: 'Enable DuckDB catalog access' })
    ).toBeChecked()
    expect(await screen.findByText('DUCKLAKE_S3_SECRET=')).toBeInTheDocument()
    expect(screen.getByText('DUCKLAKE_METADATA_PASSWORD=')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Copy all DuckLake environment variables' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy prompt' })).toBeInTheDocument()
    expect(screen.getByText('Set environment variables')).toBeInTheDocument()
    expect(screen.getByText('Attach Warehouse')).toBeInTheDocument()

    const stepsSection = screen.getByRole('heading', { name: 'Follow these steps' }).parentElement
      ?.parentElement
    expect(stepsSection).toHaveClass('border-t', 'bg-muted/50')

    expect(screen.queryByText('s3-secret')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reveal DUCKLAKE_S3_SECRET' }))
    expect(screen.getByText('s3-secret')).toBeInTheDocument()

    expect(screen.queryByText(CATALOG_PASSWORD)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reveal DUCKLAKE_METADATA_PASSWORD' }))
    expect(screen.getByText(CATALOG_PASSWORD)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('combobox', { name: 'Query engine' }))
    await userEvent.click(screen.getByRole('option', { name: 'FlightSQL' }))

    expect(screen.queryByRole('heading', { name: 'Follow these steps' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy prompt' })).not.toBeInTheDocument()
  })

  test('shows progress while updating DuckDB catalog access', async () => {
    let catalog: WarehouseCatalogResponse = { enabled: false }
    const requestBodies: UpdateWarehouseCatalogBody[] = []
    let finishUpdatingCatalog: (() => void) | undefined
    const updatingCatalog = new Promise<void>((resolve) => {
      finishUpdatingCatalog = resolve
    })

    mockSetupStatus({ setup_status: 'complete' })
    addAPIMock({
      method: 'get',
      path: '/platform/warehouse/:ref/catalog',
      response: () => HttpResponse.json<WarehouseCatalogResponse>(catalog),
    })
    addAPIMock({
      method: 'post',
      path: '/platform/warehouse/:ref/catalog',
      response: async ({ request }) => {
        const body = (await request.json()) as UpdateWarehouseCatalogBody
        requestBodies.push(body)
        await updatingCatalog
        catalog = { enabled: body.enabled }
        return HttpResponse.json<WarehouseCatalogResponse>(catalog)
      },
    })

    customRender(<WarehouseTab />, { nuqs: { hasMemory: true } })

    await userEvent.click(await screen.findByRole('combobox', { name: 'Query engine' }))
    await userEvent.click(screen.getByRole('option', { name: 'DuckDB' }))

    const catalogSwitch = await screen.findByRole('switch', {
      name: 'Enable DuckDB catalog access',
    })
    await userEvent.click(catalogSwitch)

    expect(
      await screen.findByRole('status', { name: 'Updating DuckDB catalog access' })
    ).toBeInTheDocument()
    expect(catalogSwitch).toBeDisabled()
    expect(catalogSwitch).toHaveAttribute('aria-busy', 'true')

    finishUpdatingCatalog?.()
    await waitFor(() => expect(catalogSwitch).toBeChecked())
    expect(
      screen.queryByRole('status', { name: 'Updating DuckDB catalog access' })
    ).not.toBeInTheDocument()
    expect(requestBodies).toEqual([{ enabled: true }])
  })

  test('surfaces a 544 status failure without retrying indefinitely and allows retrying', async () => {
    let requestCount = 0
    addAPIMock({
      method: 'get',
      path: '/platform/warehouse/:ref/setup-status',
      response: () => {
        requestCount += 1
        if (requestCount === 1) {
          return HttpResponse.json<APIErrorBody>(
            { message: 'Warehouse status request timed out' },
            { status: 544 }
          )
        }

        return HttpResponse.json<WarehouseSetupStatusResponse>({
          fdw_status: FDW_STATUS,
          setup_status: 'not_started',
          steps: [],
          tables: [],
        })
      },
    })
    // AlertError renders a project-scoped link to the AI assistant.
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      // @ts-expect-error partial project response
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

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: 3, retryDelay: 0 } },
    })
    customRender(<WarehouseTab />, { queryClient })

    expect(await screen.findByText('Failed to load Warehouse status')).toBeInTheDocument()
    expect(requestCount).toBe(1)

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('Warehouse is not set up')).toBeInTheDocument()
    expect(requestCount).toBe(2)
  })
})
