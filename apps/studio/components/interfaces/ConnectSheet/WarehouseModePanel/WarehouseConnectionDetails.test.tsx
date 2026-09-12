import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { WarehouseConnectionDetails } from './WarehouseConnectionDetails'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type WarehouseCatalogResponse = components['schemas']['WarehouseCatalogResponse']
type UpdateWarehouseCatalogBody = components['schemas']['UpdateWarehouseCatalogBody']

const CATALOG_PASSWORD = 'pwd'
const CATALOG_URL = 'postgres://postgres:pwd@db.example.supabase.co:5432/postgres'

const mockCatalog = (catalog: WarehouseCatalogResponse) =>
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/catalog',
    response: () => HttpResponse.json<WarehouseCatalogResponse>(catalog),
  })

mockAnimationsApi()

describe('WarehouseConnectionDetails', () => {
  test('shows FlightSQL by default without loading DuckDB catalog access', async () => {
    customRender(<WarehouseConnectionDetails onEditTables={vi.fn()} />)

    expect(await screen.findByRole('combobox', { name: 'Query engine' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('default.warehouse.supabase.io')).toBeInTheDocument()
    expect(
      screen.getByDisplayValue(
        'flightsql://postgres:[YOUR-PASSWORD]@default.warehouse.supabase.io:443?tls=enabled'
      )
    ).toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })

  test('shows the persistent catalog switch when DuckDB is selected', async () => {
    mockCatalog({ enabled: false })

    customRender(<WarehouseConnectionDetails onEditTables={vi.fn()} />)

    await userEvent.click(await screen.findByRole('combobox', { name: 'Query engine' }))
    await userEvent.click(screen.getByRole('option', { name: 'DuckDB' }))

    expect(
      await screen.findByRole('switch', { name: 'Enable DuckDB catalog access' })
    ).not.toBeChecked()
    expect(screen.queryByRole('heading', { name: 'Follow these steps' })).not.toBeInTheDocument()
  })

  test('shows DuckDB credentials as numbered steps and removes them when changing engines', async () => {
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

    customRender(<WarehouseConnectionDetails onEditTables={vi.fn()} />)

    await userEvent.click(await screen.findByRole('combobox', { name: 'Query engine' }))
    await userEvent.click(screen.getByRole('option', { name: 'DuckDB' }))

    expect(
      await screen.findByRole('switch', { name: 'Enable DuckDB catalog access' })
    ).toBeChecked()
    expect(screen.getByRole('heading', { name: 'Follow these steps' })).toBeInTheDocument()
    expect(screen.getByText('Set environment variables')).toBeInTheDocument()
    expect(screen.getByText('Attach Warehouse')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Copy all DuckLake environment variables' })
    ).toBeInTheDocument()

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

  test('enables and disables DuckDB catalog access', async () => {
    let catalog: WarehouseCatalogResponse = { enabled: false }
    const requestBodies: UpdateWarehouseCatalogBody[] = []

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
        catalog = { enabled: body.enabled }
        return HttpResponse.json<WarehouseCatalogResponse>(catalog)
      },
    })

    customRender(<WarehouseConnectionDetails onEditTables={vi.fn()} />)

    await userEvent.click(await screen.findByRole('combobox', { name: 'Query engine' }))
    await userEvent.click(screen.getByRole('option', { name: 'DuckDB' }))

    const catalogSwitch = await screen.findByRole('switch', {
      name: 'Enable DuckDB catalog access',
    })
    expect(catalogSwitch).not.toBeChecked()

    await userEvent.click(catalogSwitch)
    await waitFor(() => expect(catalogSwitch).toBeChecked())

    await userEvent.click(catalogSwitch)
    await waitFor(() => expect(catalogSwitch).not.toBeChecked())

    expect(requestBodies).toEqual([{ enabled: true }, { enabled: false }])
  })
})
