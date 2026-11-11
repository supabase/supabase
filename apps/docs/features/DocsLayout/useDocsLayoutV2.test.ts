// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { useIaNavVariant } from '~/features/IaNav/useIaNavVariant'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDocsLayoutV2 } from './useDocsLayoutV2'

vi.mock('~/features/IaNav/useIaNavVariant', () => ({ useIaNavVariant: vi.fn() }))

describe('useDocsLayoutV2', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.iaNav
  })

  it('turns on the new layout and its css for the option-1 variant', () => {
    vi.mocked(useIaNavVariant).mockReturnValue('option-1')

    const { result } = renderHook(() => useDocsLayoutV2())

    expect(result.current).toBe(true)
    expect(document.documentElement.dataset.iaNav).toBe('option-1')
  })

  it('keeps the legacy layout and drops a stale option-1 mark for the control variant', () => {
    document.documentElement.dataset.iaNav = 'option-1'
    vi.mocked(useIaNavVariant).mockReturnValue('control')

    const { result } = renderHook(() => useDocsLayoutV2())

    expect(result.current).toBe(false)
    expect(document.documentElement.dataset.iaNav).toBeUndefined()
  })
})
