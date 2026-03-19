import { waitFor } from '@testing-library/react'
import {
  useDatabaseHooksQuery,
  useDatabaseTriggersQuery,
} from 'data/database-triggers/database-triggers-query'
import { get } from 'data/fetchers'
import { customRenderHook } from 'tests/lib/custom-render'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('data/fetchers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('data/fetchers')>()
  return {
    ...actual,
    get: vi.fn(),
  }
})

describe('database-triggers-query', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns triggers from all schemas for trigger list pages', async () => {
    vi.mocked(get).mockResolvedValue({
      data: [
        {
          id: 1,
          name: 'trigger_public',
          schema: 'public',
          table: 'profiles',
          function_schema: 'public',
          function_args: [],
        },
        {
          id: 2,
          name: 'trigger_auth',
          schema: 'auth',
          table: 'users',
          function_schema: 'auth',
          function_args: [],
        },
      ],
      error: null,
    } as any)

    const { result } = customRenderHook(() =>
      useDatabaseTriggersQuery({ projectRef: 'default', connectionString: null })
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0]?.schema).toBe('public')
    expect(result.current.data?.[1]?.schema).toBe('auth')
  })

  it('keeps hook-specific filtering scoped to hooks query', async () => {
    vi.mocked(get).mockResolvedValue({
      data: [
        {
          id: 1,
          name: 'valid_hook',
          schema: 'public',
          function_schema: 'supabase_functions',
          function_args: [],
        },
        {
          id: 2,
          name: 'net_hook_with_args',
          schema: 'net',
          function_schema: 'supabase_functions',
          function_args: ['arg'],
        },
        {
          id: 3,
          name: 'custom_schema_trigger',
          schema: 'public',
          function_schema: 'public',
          function_args: [],
        },
      ],
      error: null,
    } as any)

    const { result } = customRenderHook(() =>
      useDatabaseHooksQuery({ projectRef: 'default', connectionString: null })
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].name).toBe('valid_hook')
  })
})
