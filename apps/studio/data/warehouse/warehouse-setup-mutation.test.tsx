import { act, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import type {
  V2WarehouseSetupAcceptedResponse,
  V2WarehouseSetupRequest,
  V2WarehouseSetupStatusResponse,
} from './warehouse-setup-api-types'
import { useWarehouseSetupMutation, type WarehouseSetupBody } from './warehouse-setup-mutation'
import { useWarehouseSetupStatusQuery } from './warehouse-setup-status-query'
import {
  createMockWarehouseSetupResponse,
  createMockWarehouseSetupStatusResponse,
} from '@/components/interfaces/Integrations/Warehouse/Warehouse.fixtures'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock, type V2APIErrorBody } from '@/tests/lib/msw'

const TARGETS: WarehouseSetupBody['targets'] = [
  { type: 'schema', schema: 'public' },
  { type: 'table', schema: 'analytics', name: 'events' },
]

const mockSetupAccepted = (attributes?: Parameters<typeof createMockWarehouseSetupResponse>[0]) => {
  const requests: V2WarehouseSetupRequest[] = []
  addAPIMock({
    method: 'post',
    path: '/v2/projects/:ref/warehouse/setups',
    response: async ({ request }) => {
      requests.push((await request.json()) as V2WarehouseSetupRequest)
      return HttpResponse.json<V2WarehouseSetupAcceptedResponse>(
        createMockWarehouseSetupResponse(attributes),
        { status: 202 }
      )
    },
  })
  return requests
}

describe('useWarehouseSetupMutation', () => {
  test('replaces the selection through the v2 setups resource and unwraps the accepted setup', async () => {
    const requests = mockSetupAccepted({
      pipeline_id: 'pipeline-1',
      tables: [{ schema: 'public', name: 'orders', copy_name: 'public.orders', state: 'syncing' }],
    })
    const { result } = customRenderHook(() => useWarehouseSetupMutation({ onError: () => {} }))

    const data = await act(() =>
      result.current.mutateAsync({ projectRef: 'default', body: { targets: TARGETS } })
    )

    // The request body is the contract: the reply doesn't echo the selection back.
    expect(requests).toEqual([
      { data: { type: 'warehouse_setup', attributes: { targets: TARGETS } } },
    ])
    expect(data).toMatchObject({
      accepted: true,
      pipeline_id: 'pipeline-1',
      tables: [{ schema: 'public', name: 'orders', copy_name: 'public.orders', state: 'syncing' }],
    })
  })

  test('surfaces the error description with the HTTP status', async () => {
    addAPIMock({
      method: 'post',
      path: '/v2/projects/:ref/warehouse/setups',
      response: () =>
        HttpResponse.json<V2APIErrorBody>(
          {
            error: {
              code: 'warehouse_lifecycle_conflict',
              message: 'Another Warehouse lifecycle operation is in progress',
              description: 'Another Warehouse mutation is running.',
            },
          },
          { status: 409 }
        ),
    })
    const { result } = customRenderHook(() => useWarehouseSetupMutation({ onError: () => {} }))

    act(() => result.current.mutate({ projectRef: 'default', body: { targets: TARGETS } }))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toMatchObject({
      message: 'Another Warehouse mutation is running.',
      code: 409,
    })
  })

  test('refreshes the setup status once the setup is accepted', async () => {
    let statusRequests = 0
    addAPIMock({
      method: 'get',
      path: '/v2/projects/:ref/warehouse/setups/current',
      response: () => {
        statusRequests += 1
        return HttpResponse.json<V2WarehouseSetupStatusResponse>(
          createMockWarehouseSetupStatusResponse({
            setup_status: statusRequests === 1 ? 'not_started' : 'setting_up',
          })
        )
      },
    })
    mockSetupAccepted()
    const { result } = customRenderHook(() => ({
      status: useWarehouseSetupStatusQuery({ projectRef: 'default' }),
      setup: useWarehouseSetupMutation({ onError: () => {} }),
    }))
    await waitFor(() => expect(result.current.status.data?.setup_status).toBe('not_started'))

    await act(() =>
      result.current.setup.mutateAsync({ projectRef: 'default', body: { targets: TARGETS } })
    )

    await waitFor(() => expect(result.current.status.data?.setup_status).toBe('setting_up'))
  })
})
