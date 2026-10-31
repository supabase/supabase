import { act, render } from '@testing-library/react'
import { expect, suite, test } from 'vitest'

import { routerMock } from '../lib/route-mock'
import { RouterComponent } from './router'

suite('Router Mock', () => {
  test('Router mock works as expected', async () => {
    const comp = render(<RouterComponent />)
    expect(comp.container.textContent).toContain('path: /')

    await act(() => routerMock.push('/test'))
    expect(routerMock.pathname).toBe('/test')
    expect(comp.container.textContent).toContain('path: /test')

    // The router mock is not reset between tests, so restore it explicitly
    routerMock.setCurrentUrl('/')
  })
})
