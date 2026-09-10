import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { WarehouseOverviewTab } from './OverviewTab'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type WarehouseSetupStatusResponse = components['schemas']['WarehouseSetupStatusResponse']
type WarehouseCatalogResponse = components['schemas']['WarehouseCatalogResponse']
type WarehouseSetupBody = components['schemas']['WarehouseSetupBody']

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
    <div>
      <span>Replicated tables picker</span>
      {!!error && <span>Picker error: {error.message}</span>}
    </div>
  ),
}))

mockAnimationsApi()

const FDW_STATUS: WarehouseSetupStatusResponse['fdw_status'] = {
  extension_available: true,
  extension_installed: true,
  foreign_schema_imported: true,
  schema_created: true,
  server_configured: true,
  wrapper_installed: true,
}

const mockSetupStatus = (setupStatus: WarehouseSetupStatusResponse['setup_status']) =>
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/setup-status',
    response: () =>
      HttpResponse.json<WarehouseSetupStatusResponse>({
        fdw_status: FDW_STATUS,
        setup_status: setupStatus,
        steps: [],
        tables: [],
      }),
  })

const mockCatalog = () =>
  addAPIMock({
    method: 'get',
    path: '/platform/warehouse/:ref/catalog',
    response: () => HttpResponse.json<WarehouseCatalogResponse>({ enabled: false }),
  })

describe('WarehouseOverviewTab', () => {
  beforeEach(() => {
    mockIsMarketplaceEnabled.mockReturnValue(true)
  })

  test.each([false, true])(
    'offers only the picker before setup (marketplace: %s)',
    async (isMarketplaceEnabled) => {
      mockIsMarketplaceEnabled.mockReturnValue(isMarketplaceEnabled)
      mockSetupStatus('not_started')

      customRender(<WarehouseOverviewTab />)

      expect(await screen.findByText('Replicated tables picker')).toBeInTheDocument()
      expect(screen.queryByText('External access')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Disable Warehouse' })).not.toBeInTheDocument()
    }
  )

  test('shows everything on one page once complete', async () => {
    mockSetupStatus('complete')
    mockCatalog()

    customRender(<WarehouseOverviewTab />)

    expect(await screen.findByText('External access')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Replicated tables' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Catalog access' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Disable Warehouse' })).toBeInTheDocument()
    expect(screen.getByText('Replicated tables picker')).toBeInTheDocument()
  })

  test('tears Warehouse down with an empty target list, and only after confirmation', async () => {
    mockSetupStatus('complete')
    mockCatalog()

    const setupRequests: WarehouseSetupBody[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/warehouse/:ref/setup',
      response: async ({ request }) => {
        setupRequests.push((await request.json()) as WarehouseSetupBody)
        return HttpResponse.json({})
      },
    })

    customRender(<WarehouseOverviewTab />)

    await userEvent.click(await screen.findByRole('button', { name: 'Disable Warehouse' }))
    expect(setupRequests).toEqual([])

    await userEvent.type(
      await screen.findByPlaceholderText('Type the project ref to confirm'),
      'default'
    )
    // The confirm button sits outside the form and is associated by id, which userEvent doesn't
    // reliably submit under jsdom.
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Disable Warehouse' })
    )

    await waitFor(() => expect(setupRequests).toEqual([{ targets: [] }]))
  })
})
