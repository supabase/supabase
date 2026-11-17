import { describe, expect, it } from 'vitest'

import { EXPLORER_LOGS_VIEWS, getLogsViewHref, isLogsViewApplied } from './ExplorerLogsTab.utils'

const view = (id: string) => {
  const found = EXPLORER_LOGS_VIEWS.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`No view ${id}`)
  return found
}

describe('getLogsViewHref', () => {
  it('opens All logs with no filters, so nothing is narrowed', () => {
    expect(getLogsViewHref('ref', view('all'))).toBe('/project/ref/explorer/logs')
  })

  it("puts a view's filters in the URL, where the filter bar reads them", () => {
    const href = getLogsViewHref('ref', view('edge-functions'))
    const filters = new URL(href, 'http://localhost').searchParams.get('filter')
    expect(filters?.split(',')).toEqual([
      'log_type:eq:edge function',
      'log_type:eq:edge function runtime',
    ])
  })
})

describe('isLogsViewApplied', () => {
  it('marks a view current when the URL holds exactly its filters, in any order', () => {
    expect(isLogsViewApplied(view('errors'), ['level:eq:error'])).toBe(true)
    expect(
      isLogsViewApplied(view('edge-functions'), [
        'log_type:eq:edge function runtime',
        'log_type:eq:edge function',
      ])
    ).toBe(true)
  })

  it('marks no view current once someone adds a filter, as with a modified saved view', () => {
    expect(isLogsViewApplied(view('errors'), ['level:eq:error', 'log_type:eq:auth'])).toBe(false)
    expect(isLogsViewApplied(view('all'), ['level:eq:error'])).toBe(false)
  })

  it('treats no filters in the URL as All logs', () => {
    expect(isLogsViewApplied(view('all'), null)).toBe(true)
  })
})
