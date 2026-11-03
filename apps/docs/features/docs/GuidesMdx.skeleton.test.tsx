// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { GuideSkeleton } from './GuidesMdx.skeleton'

vi.mock('next/navigation', () => ({ usePathname: () => '/guides/auth' }))
vi.mock('~/components/Breadcrumbs', () => ({ default: () => null }))

describe('GuideSkeleton', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  // the page fades in only while the mark is on, so the mark must last the reveal and then go
  it('marks the page for the length of its reveal when it unmounts', () => {
    vi.useFakeTimers()
    const { unmount } = render(<GuideSkeleton shapes={{}} />)

    unmount()
    expect(document.documentElement.dataset.guideReveal).toBe('')

    vi.advanceTimersByTime(399)
    expect(document.documentElement.dataset.guideReveal).toBe('')

    vi.advanceTimersByTime(1)
    expect(document.documentElement.dataset.guideReveal).toBeUndefined()
  })
})
