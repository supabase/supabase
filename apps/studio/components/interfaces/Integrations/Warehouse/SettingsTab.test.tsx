import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { WarehouseSettingsTab } from './SettingsTab'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type WarehouseSetupStatusResponse = components['schemas']['WarehouseSetupStatusResponse']
type WarehouseCatalogResponse = components['schemas']['WarehouseCatalogResponse']
type WarehouseSetupBody = components['schemas']['WarehouseSetupBody']

// The tab renders the same content on both the marketplace and legacy shells; the flag reads a
// context plus ConfigCat, neither of which `customRender` provides.
const mockIsMarketplaceEnabled = vi.fn(() => false)
vi.mock('@/components/interfaces/App/FeaturePreview/FeaturePreviewContext', () => ({
  useIsMarketplaceEnabled: () => mockIsMarketplaceEnabled(),
}))

// The schema/table picker is exercised by its own unit tests and fires four upstream queries.
vi.mock('./WarehouseSchemaTablePicker', () => ({
  WarehouseSchemaTablePicker: () => <div>Replicated tables picker</div>,
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

describe('WarehouseSettingsTab', () => {
  beforeEach(() => {
    mockIsMarketplaceEnabled.mockReturnValue(false)
  })

  test('sends users back to Overview when Warehouse is not set up', async () => {
    mockSetupStatus('not_started')

    customRender(<WarehouseSettingsTab />)

    expect(await screen.findByText('Warehouse is not set up')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'href',
      '/project/default/integrations/warehouse/overview'
    )
    expect(screen.queryByText('Replicated tables picker')).not.toBeInTheDocument()
  })

  test.each([false, true])(
    'renders the settings once provisioned (marketplace: %s)',
    async (isMarketplaceEnabled) => {
      mockIsMarketplaceEnabled.mockReturnValue(isMarketplaceEnabled)
      mockSetupStatus('complete')
      mockCatalog()

      customRender(<WarehouseSettingsTab />)

      expect(await screen.findByText('Replicated tables picker')).toBeInTheDocument()
      expect(screen.getByText('Catalog access')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Disable Warehouse' })).toBeInTheDocument()
    }
  )

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

    customRender(<WarehouseSettingsTab />)

    await userEvent.click(await screen.findByRole('button', { name: 'Disable Warehouse' }))

    // Opening the dialog must not be enough on its own.
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
