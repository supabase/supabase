import { screen } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { DatabaseFormSchema, PerformanceSettingsForm } from './PerformanceSettingsForm'
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

vi.mock('@/hooks/misc/useCheckPermissionsV2', () => ({
  useAsyncCheckPermissionsV2: () => ({ can: true, isLoading: false, isSuccess: true }),
  FGA_PERMISSIONS: {
    PROJECT: {
      AUTH_CONFIG_READ: 'auth_config_read',
      AUTH_CONFIG_WRITE: 'auth_config_write',
    },
  },
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

describe('DatabaseFormSchema', () => {
  test.each([
    { size: 1, unit: 'percent', valid: true },
    { size: 100, unit: 'percent', valid: true },
    { size: 0, unit: 'percent', valid: false },
    { size: 101, unit: 'percent', valid: false },
    { size: -5, unit: 'percent', valid: false },
    { size: '75', unit: 'percent', valid: true },
    { size: '150', unit: 'percent', valid: false },
    { size: 1, unit: 'connections', valid: true },
    // No upper schema bound for an absolute connection count
    { size: 500, unit: 'connections', valid: true },
    { size: 0, unit: 'connections', valid: false },
    { size: 10, unit: 'bytes', valid: false },
  ])('pool size $size with unit $unit -> valid: $valid', ({ size, unit, valid }) => {
    const result = DatabaseFormSchema.safeParse({
      DB_MAX_POOL_SIZE: size,
      DB_MAX_POOL_SIZE_UNIT: unit,
    })
    expect(result.success).toBe(valid)
  })

  test('explains the percentage bounds when out of range', () => {
    const result = DatabaseFormSchema.safeParse({
      DB_MAX_POOL_SIZE: 101,
      DB_MAX_POOL_SIZE_UNIT: 'percent',
    })
    const issue = result.error?.issues.find((i) => i.path[0] === 'DB_MAX_POOL_SIZE')
    expect(issue?.message).toBe('Percentage must be between 1 and 100')
  })
})

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
