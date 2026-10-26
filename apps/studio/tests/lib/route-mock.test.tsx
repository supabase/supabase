import { act, renderHook } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { expect, it } from 'vitest'

import { routerMock } from './route-mock'

it('reports the current page path and follows navigation without query parameters', () => {
  const initialUrl = routerMock.asPath
  try {
    routerMock.setCurrentUrl('/project/default/functions/send-email/details?tab=settings')
    const { result } = renderHook(() => usePathname())

    expect(result.current).toBe('/project/default/functions/send-email/details')

    act(() => routerMock.setCurrentUrl('/project/default/functions/send-email/code?version=2'))

    expect(result.current).toBe('/project/default/functions/send-email/code')
  } finally {
    act(() => routerMock.setCurrentUrl(initialUrl))
  }
})
