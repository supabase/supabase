import { waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import type { V2WarehouseSetupStatusResponse } from './warehouse-setup-api-types'
import { useWarehouseSetupStatusQuery } from './warehouse-setup-status-query'
import {
  createMockWarehouseSetupStatusResponse,
  WAREHOUSE_FDW_STATUS,
} from '@/components/interfaces/Integrations/Warehouse/Warehouse.fixtures'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock, type V2APIErrorBody } from '@/tests/lib/msw'

describe('useWarehouseSetupStatusQuery', () => {
  test('unwraps the v2 envelope into the flat fields the UI reads', async () => {
    let requestedSearch: string | undefined
    addAPIMock({
      method: 'get',
      path: '/v2/projects/:ref/warehouse/setups/current',
      response: ({ request }) => {
        requestedSearch = new URL(request.url).search
        return HttpResponse.json<V2WarehouseSetupStatusResponse>(
          createMockWarehouseSetupStatusResponse({
            setup_status: 'copying',
            pipeline_id: 'pipeline-1',
            steps: [
              { name: 'warehouse_copy', status: 'running', message: 'Copying public.orders' },
            ],
            tables: [
              { schema: 'public', name: 'orders', copy_name: 'public.orders', state: 'syncing' },
            ],
          })
        )
      },
    })

    const { result } = customRenderHook(() =>
      useWarehouseSetupStatusQuery({ projectRef: 'default' })
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toMatchObject({
      setup_status: 'copying',
      pipeline_id: 'pipeline-1',
      steps: [{ name: 'warehouse_copy', status: 'running', message: 'Copying public.orders' }],
      tables: [{ schema: 'public', name: 'orders', copy_name: 'public.orders', state: 'syncing' }],
      fdw_status: WAREHOUSE_FDW_STATUS,
    })
    // Without `selection_id` or `inspect_fdw` the API inspects the FDW, like the legacy route did.
    // Either parameter would null out `fdw_status` or reject a changed selection.
    expect(requestedSearch).toBe('')
  })

  test('reads the status before setup, when there is no pipeline yet', async () => {
    addAPIMock({
      method: 'get',
      path: '/v2/projects/:ref/warehouse/setups/current',
      response: () =>
        HttpResponse.json<V2WarehouseSetupStatusResponse>(createMockWarehouseSetupStatusResponse()),
    })

    const { result } = customRenderHook(() =>
      useWarehouseSetupStatusQuery({ projectRef: 'default' })
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toMatchObject({
      setup_status: 'not_started',
      pipeline_id: undefined,
    })
  })

  test('surfaces the error description with the HTTP status', async () => {
    addAPIMock({
      method: 'get',
      path: '/v2/projects/:ref/warehouse/setups/current',
      response: () =>
        HttpResponse.json<V2APIErrorBody>(
          {
            error: {
              code: 'warehouse_setup_unavailable',
              message: 'Warehouse setup is unavailable',
              description: 'Failed to get Warehouse FDW setup status',
            },
          },
          { status: 503 }
        ),
    })

    const { result } = customRenderHook(() =>
      useWarehouseSetupStatusQuery({ projectRef: 'default' })
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toMatchObject({
      message: 'Failed to get Warehouse FDW setup status',
      code: 503,
    })
  })
})
