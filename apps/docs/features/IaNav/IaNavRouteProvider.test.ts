// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { IaNavRouteProvider, useDocsPathname } from './IaNavRouteProvider'

vi.mock('next/navigation', () => ({
  useSelectedLayoutSegments: vi.fn(() => ['ia', 'option-1', 'guides', 'storage']),
  usePathname: vi.fn(() => '/ia/option-1/guides/storage/uploads%2Fresumable-uploads'),
}))

describe('useDocsPathname on the option-1 route', () => {
  it('returns the public pathname of a nested guide page', () => {
    const { result } = renderHook(() => useDocsPathname(), { wrapper: IaNavRouteProvider })

    expect(result.current).toBe('/guides/storage/uploads/resumable-uploads')
  })
})
