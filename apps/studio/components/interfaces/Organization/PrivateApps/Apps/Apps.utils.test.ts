import { describe, expect, it, vi } from 'vitest'

import type { PrivateApp } from '../PrivateApps.types'
import type { AppsSort } from './Apps.types'
import { handleSortChange, sortApps } from './Apps.utils'

describe('handleSortChange', () => {
  it('toggles from asc to desc when clicking the same column', () => {
    const setSort = vi.fn()
    handleSortChange('created_at:asc', 'created_at', setSort)
    expect(setSort).toHaveBeenCalledWith('created_at:desc')
  })

  it('toggles from desc to asc when clicking the same column', () => {
    const setSort = vi.fn()
    handleSortChange('created_at:desc', 'created_at', setSort)
    expect(setSort).toHaveBeenCalledWith('created_at:asc')
  })

  it('defaults to asc when switching to a different column', () => {
    const setSort = vi.fn()
    handleSortChange('created_at:desc', 'name', setSort)
    expect(setSort).toHaveBeenCalledWith('name:asc')
  })
})

const makeApp = (id: string, created_at: string): PrivateApp =>
  ({
    id,
    name: id,
    created_at,
    description: '',
  }) as unknown as PrivateApp

describe('sortApps', () => {
  const apps = [
    makeApp('b', '2024-01-02T00:00:00Z'),
    makeApp('a', '2024-01-01T00:00:00Z'),
    makeApp('c', '2024-01-03T00:00:00Z'),
  ]

  it('sorts in ascending order', () => {
    const sorted = sortApps(apps, 'created_at:asc' as AppsSort)
    expect(sorted.map((a) => a.id)).toEqual(['a', 'b', 'c'])
  })

  it('sorts in descending order', () => {
    const sorted = sortApps(apps, 'created_at:desc' as AppsSort)
    expect(sorted.map((a) => a.id)).toEqual(['c', 'b', 'a'])
  })

  it('does not mutate the original array', () => {
    const original = [...apps]
    sortApps(apps, 'created_at:asc' as AppsSort)
    expect(apps).toEqual(original)
  })
})
