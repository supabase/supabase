// @vitest-environment jsdom
import { act, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useLogsViewsMock } from './useLogsViews.mock'
import { customRenderHook } from '@/tests/lib/custom-render'

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  window.localStorage.clear()
})

const createErrorsOnlyView = () => ({
  name: 'Errors only',
  logSource: 'edge_logs',
  filters: { logicalOperator: 'AND' as const, conditions: [] },
  viewOptions: {},
})

describe('useLogsViewsMock', () => {
  it('starts with an empty list', async () => {
    const { result } = customRenderHook(() => useLogsViewsMock())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.views).toEqual([])
  })

  it('creates a view with a generated id', async () => {
    const { result } = customRenderHook(() => useLogsViewsMock())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.createView(createErrorsOnlyView()))

    await waitFor(() => expect(result.current.views).toHaveLength(1))
    expect(result.current.views[0]).toMatchObject({
      type: 'logs_view',
      version: 1,
      name: 'Errors only',
      logSource: 'edge_logs',
    })
    expect(result.current.views[0].id).toEqual(expect.any(String))
  })

  it('updates an existing view by id', async () => {
    const { result } = customRenderHook(() => useLogsViewsMock())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.createView(createErrorsOnlyView()))
    await waitFor(() => expect(result.current.views).toHaveLength(1))
    const id = result.current.views[0].id

    act(() => result.current.updateView(id, { name: 'Renamed' }))

    await waitFor(() => expect(result.current.views[0].name).toBe('Renamed'))
  })

  it('deletes a view by id', async () => {
    const { result } = customRenderHook(() => useLogsViewsMock())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.createView(createErrorsOnlyView()))
    await waitFor(() => expect(result.current.views).toHaveLength(1))
    const id = result.current.views[0].id

    act(() => result.current.deleteView(id))

    await waitFor(() => expect(result.current.views).toEqual([]))
  })

  it('persists views in localStorage so a fresh hook instance picks them up', async () => {
    const first = customRenderHook(() => useLogsViewsMock())
    await waitFor(() => expect(first.result.current.isLoading).toBe(false))

    act(() => first.result.current.createView(createErrorsOnlyView()))
    await waitFor(() => expect(first.result.current.views).toHaveLength(1))

    const second = customRenderHook(() => useLogsViewsMock())

    await waitFor(() => expect(second.result.current.views).toHaveLength(1))
    expect(second.result.current.views[0].name).toBe('Errors only')
  })
})
