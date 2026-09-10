import { screen } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import { WarehouseTab } from './WarehouseTab'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type WarehouseSetupStatusResponse = components['schemas']['WarehouseSetupStatusResponse']
type WarehouseCatalogResponse = components['schemas']['WarehouseCatalogResponse']

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

const mockCatalog = (catalog: WarehouseCatalogResponse) =>
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/catalog',
    response: () => HttpResponse.json<WarehouseCatalogResponse>(catalog),
  })

describe('WarehouseTab', () => {
  test('points at the integration and shows no setup UI when Warehouse is not set up', async () => {
    mockSetupStatus({ setup_status: 'not_started' })

    customRender(<WarehouseTab />)

    expect(await screen.findByText('Warehouse is not set up')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Set up Warehouse' })).toHaveAttribute(
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

  test('renders read-only connection details, and no catalog action, once complete', async () => {
    mockSetupStatus({ setup_status: 'complete' })
    mockCatalog({ enabled: false })

    customRender(<WarehouseTab />)

    expect(await screen.findByText('External access')).toBeInTheDocument()
    expect(screen.getByDisplayValue('default.warehouse.supabase.io')).toBeInTheDocument()
    expect(
      screen.getByDisplayValue(
        'flightsql://postgres:[YOUR-PASSWORD]@default.warehouse.supabase.io:443?tls=enabled'
      )
    ).toBeInTheDocument()

    // Enabling catalog access is provisioning, so it belongs on the integration, not here.
    expect(await screen.findByRole('link', { name: 'Warehouse settings' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Enable catalog access/i })).not.toBeInTheDocument()
  })

  test('renders the DuckLake attach script when catalog access is on', async () => {
    mockSetupStatus({ setup_status: 'complete' })
    mockCatalog({
      enabled: true,
      credentials: {
        catalog_url: 'postgres://postgres:secret@db.default.supabase.co:5432/postgres',
        data_path: 's3://warehouse/',
        metadata_schema: 'ducklake',
        s3_access_key_id: 'access-key-id',
        s3_endpoint: 'default.storage.supabase.co/storage/v1/s3',
        s3_region: 'ap-southeast-1',
        s3_secret_access_key: 's3-secret',
      },
    })

    customRender(<WarehouseTab />)

    // The setup script renders through a syntax highlighter that splits it across elements, so
    // assert on the env vars it tells you to set and the values behind them.
    expect(await screen.findByText('DUCKLAKE_S3_SECRET')).toBeInTheDocument()
    expect(screen.getByText('DUCKLAKE_METADATA_PASSWORD')).toBeInTheDocument()
    expect(screen.getByDisplayValue('s3-secret')).toBeInTheDocument()
    expect(screen.getByDisplayValue('secret')).toBeInTheDocument()
  })

  test('surfaces a failure to load the status', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/warehouse/:ref/setup-status',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Boom' }, { status: 500 }),
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

    customRender(<WarehouseTab />)

    expect(await screen.findByText('Failed to load Warehouse status')).toBeInTheDocument()
  })
})
