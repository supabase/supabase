import { act, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useDashboardHistory } from './useDashboardHistory'
import { customRenderHook } from '@/tests/lib/custom-render'

// useParams from 'common' is globally mocked to { ref: 'default' } in vitestSetup

const renderDashboardHistory = async () => {
  const utils = customRenderHook(() => useDashboardHistory())
  await waitFor(() => expect(utils.result.current.isHistoryLoaded).toBe(true))
  return utils
}

describe('useDashboardHistory', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores the last visited snippet', async () => {
    const { result } = await renderDashboardHistory()

    act(() => result.current.setLastVisitedSnippet('snippet-a'))

    await waitFor(() => expect(result.current.history.sql).toBe('snippet-a'))
  })

  describe('clearSnippetsFromHistory', () => {
    it('purges the last visited snippet when it is one of the deleted ids', async () => {
      const { result } = await renderDashboardHistory()

      act(() => result.current.setLastVisitedSnippet('snippet-a'))
      await waitFor(() => expect(result.current.history.sql).toBe('snippet-a'))

      act(() => result.current.clearSnippetsFromHistory(['snippet-b', 'snippet-a']))

      await waitFor(() => expect(result.current.history.sql).toBeUndefined())
    })

    it('keeps the last visited snippet when it is not among the deleted ids', async () => {
      const { result } = await renderDashboardHistory()

      act(() => result.current.setLastVisitedSnippet('snippet-a'))
      await waitFor(() => expect(result.current.history.sql).toBe('snippet-a'))

      act(() => result.current.clearSnippetsFromHistory(['snippet-b']))

      await waitFor(() => expect(result.current.history.sql).toBe('snippet-a'))
    })

    it('does not touch the table editor history', async () => {
      const { result } = await renderDashboardHistory()

      act(() => result.current.setLastVisitedTable('table-1'))
      // setLastVisitedSnippet spreads the render-time history, so wait for the
      // table update to propagate before setting the snippet
      await waitFor(() => expect(result.current.history.editor).toBe('table-1'))
      act(() => result.current.setLastVisitedSnippet('snippet-a'))
      await waitFor(() => expect(result.current.history.sql).toBe('snippet-a'))

      act(() => result.current.clearSnippetsFromHistory(['snippet-a']))

      await waitFor(() => expect(result.current.history.sql).toBeUndefined())
      expect(result.current.history.editor).toBe('table-1')
    })
  })
})
