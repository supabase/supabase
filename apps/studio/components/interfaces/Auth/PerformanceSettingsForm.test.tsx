import { screen } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { PerformanceSettingsForm } from './PerformanceSettingsForm'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants')>()
  return { ...actual, IS_PLATFORM: true }
})

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({ data: { ref: 'default', connectionString: null } }),
}))

vi.mock('@/hooks/misc/useCheckEntitlements', () => ({
  useCheckEntitlements: () => ({ hasAccess: true, isLoading: false }),
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true, isLoading: false, isSuccess: true }),
}))

function mockAuthConfig(overrides: Record<string, unknown>) {
  addAPIMock({
    method: 'get',
    path: '/platform/auth/:ref/config',
    response: () =>
      HttpResponse.json<any>({
        API_MAX_REQUEST_DURATION: 10,
        DB_MAX_POOL_SIZE: 10,
        DB_MAX_POOL_SIZE_UNIT: 'connections',
        ...overrides,
      }),
  })
}

function mockMaxConnections(maxConnections: number) {
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: () => HttpResponse.json<any>([{ max_connections: maxConnections }]),
  })
}

describe('PerformanceSettingsForm', () => {
  test('reflects a persisted percentage allocation strategy after loading', async () => {
    mockAuthConfig({ DB_MAX_POOL_SIZE: 15, DB_MAX_POOL_SIZE_UNIT: 'percent' })
    mockMaxConnections(60)

    customRender(<PerformanceSettingsForm />)

    expect(await screen.findByText('Percentage')).toBeInTheDocument()
    expect(screen.getByDisplayValue('15')).toBeInTheDocument()
    expect(screen.getByText('%')).toBeInTheDocument()
  })

  test('reflects a persisted absolute allocation strategy after loading', async () => {
    mockAuthConfig({ DB_MAX_POOL_SIZE: 12, DB_MAX_POOL_SIZE_UNIT: 'connections' })
    mockMaxConnections(60)

    customRender(<PerformanceSettingsForm />)

    expect(await screen.findByText('Absolute')).toBeInTheDocument()
    expect(screen.getByDisplayValue('12')).toBeInTheDocument()
    expect(screen.getByText('connections')).toBeInTheDocument()
  })
})
