// @vitest-environment jsdom

import { act, createElement, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import BlogClient from './BlogClient'

const observers: MockIntersectionObserver[] = []

class MockIntersectionObserver {
  callback: (entries: IntersectionObserverEntry[]) => void

  constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
    this.callback = callback
    observers.push(this)
  }

  observe() {}

  unobserve() {}
}

vi.mock('components/Blog/BlogFilters', () => ({
  default: ({ onFilterChange }: { onFilterChange: (category?: string) => void }) =>
    createElement('button', { onClick: () => onFilterChange('postgres') }, 'Filter'),
}))

vi.mock('components/Blog/BlogGridItem', () => ({
  default: () => createElement('div', null, 'Grid post'),
}))

vi.mock('components/Blog/BlogListItem', () => ({
  default: () => createElement('div', null, 'List post'),
}))

vi.mock('../../components/Layouts/SectionContainerWithCn', () => ({
  default: ({ children }: { children: ReactNode }) => createElement('div', null, children),
}))

vi.mock('@/components/Layouts/SectionContainer', () => ({
  default: ({ children }: { children: ReactNode }) => createElement('div', null, children),
}))

describe('BlogClient', () => {
  const fetchMock = vi.fn()
  const roots: Array<ReturnType<typeof createRoot>> = []

  beforeEach(() => {
    observers.length = 0
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    window.fetch = fetchMock
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  })

  afterEach(() => {
    roots.forEach((root) => root.unmount())
    roots.length = 0
    vi.unstubAllGlobals()
  })

  it('preserves the category when loading more filtered posts', async () => {
    fetchMock
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          posts: Array.from({ length: 25 }, (_, index) => ({ slug: `postgres-${index}` })),
          total: 30,
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          posts: Array.from({ length: 5 }, (_, index) => ({ slug: `postgres-more-${index}` })),
          total: 30,
        }),
      })

    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    roots.push(root)
    act(() => {
      root.render(
        createElement(BlogClient, { initialBlogs: [], totalPosts: 0, initialView: 'list' })
      )
    })

    act(() => {
      container.querySelector('button')?.click()
    })

    await act(async () => {
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1), { timeout: 5000 })
    })

    const firstRequest = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
    expect(firstRequest.searchParams.get('category')).toBe('postgres')

    await act(async () => {
      await vi.waitFor(() => expect(observers.length).toBeGreaterThan(0), { timeout: 5000 })
    })
    const observer = observers.at(-1)
    expect(observer).toBeDefined()

    await act(async () => {
      observer?.callback([{ isIntersecting: true } as IntersectionObserverEntry])
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2), { timeout: 5000 })
    })

    const secondRequest = new URL(fetchMock.mock.calls[1][0], 'http://localhost')
    expect(secondRequest.searchParams.get('offset')).toBe('25')
    expect(secondRequest.searchParams.get('limit')).toBe('25')
    expect(secondRequest.searchParams.get('category')).toBe('postgres')
  })
})
