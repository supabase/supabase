// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { useFeatureFlags, useSearchParamsShallow } from 'common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DOCS_LAYOUT_FLAG } from './constants'
import { useDocsLayoutV2 } from './useDocsLayoutV2'

vi.mock('common', () => ({
  useFeatureFlags: vi.fn(),
  useSearchParamsShallow: vi.fn(),
}))

function renderLayout({ flagValue, override }: { flagValue?: boolean; override?: string }) {
  const posthog = flagValue === undefined ? {} : { [DOCS_LAYOUT_FLAG]: flagValue }
  vi.mocked(useFeatureFlags).mockReturnValue({ posthog } as unknown as ReturnType<
    typeof useFeatureFlags
  >)
  vi.mocked(useSearchParamsShallow).mockReturnValue(
    new URLSearchParams(
      override === undefined ? {} : { [DOCS_LAYOUT_FLAG]: override }
    ) as unknown as ReturnType<typeof useSearchParamsShallow>
  )

  return renderHook(() => useDocsLayoutV2())
}

describe('useDocsLayoutV2', () => {
  beforeEach(() => {
    sessionStorage.clear()
    delete document.documentElement.dataset.docsLayout
  })

  it('keeps the current layout while the flag is unset', () => {
    const { result } = renderLayout({})

    expect(result.current).toBe(false)
    expect(document.documentElement.dataset.docsLayout).toBeUndefined()
  })

  it('turns on the new layout and marks the html element for the flag', () => {
    const { result } = renderLayout({ flagValue: true })

    expect(result.current).toBe(true)
    expect(document.documentElement.dataset.docsLayout).toBe('v2')
  })

  it('lets the url override the flag', () => {
    const { result } = renderLayout({ flagValue: true, override: 'false' })

    expect(result.current).toBe(false)
    expect(document.documentElement.dataset.docsLayout).toBeUndefined()
  })

  it('keeps the url override on the next page of the session', () => {
    renderLayout({ override: 'true' })
    const { result } = renderLayout({ flagValue: false })

    expect(result.current).toBe(true)
  })

  it('keeps the session override when the url param is empty', () => {
    renderLayout({ override: 'true' })
    const { result } = renderLayout({ flagValue: false, override: '' })

    expect(result.current).toBe(true)
  })

  it('ignores a url value other than true or false', () => {
    const { result } = renderLayout({ flagValue: true, override: '1' })

    expect(result.current).toBe(true)
    expect(sessionStorage.getItem(DOCS_LAYOUT_FLAG)).toBeNull()
  })
})
