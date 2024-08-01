import { render, screen, waitFor } from '@testing-library/react'
import { RouterComponent } from './router'
import { expect, suite, vi } from 'vitest'
import { routerMock } from 'tests/mocks/router'

suite('Router Mock', () => {
  test('Router mock works as expected', async () => {
    const comp = render(<RouterComponent />)
    expect(comp.container.textContent).toContain('path: /')
    expect(routerMock.pathname).toBe('/')
  })

  test('Clicking on link changes the path', async () => {
    const comp = render(<RouterComponent />)

    const link = screen.getByRole('link')

    link.click()

    waitFor(() => {
      expect(routerMock.pathname).toBe('/test')
      expect(comp.container.textContent).toContain('path: /test')
    })
  })

  test('Router mock is reset after each test', async () => {
    const comp = render(<RouterComponent />)
    expect(comp.container.textContent).toContain('path: /')
    expect(routerMock.pathname).toBe('/')
  })
})
