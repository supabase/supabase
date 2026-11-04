// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { useDocsLayoutV2 } from '~/features/DocsLayout/useDocsLayoutV2'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ReferenceContentScrollHandler } from './Reference.navigation.client'

vi.mock('~/features/DocsLayout/useDocsLayoutV2', () => ({ useDocsLayoutV2: vi.fn() }))
vi.mock('next/navigation', () => ({ usePathname: () => '/reference/javascript/select' }))

const sectionTop = { value: 0 }

const renderPage = () => (
  <ReferenceContentScrollHandler libPath="javascript" version="v2" isLatestVersion>
    <section id="select" />
  </ReferenceContentScrollHandler>
)

describe('ReferenceContentScrollHandler', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
      configurable: true,
      get() {
        return this.id === 'select' ? sectionTop.value : 0
      },
    })
  })

  afterEach(cleanup)

  it('scrolls to the deep link section again when the new layout moves it', () => {
    vi.mocked(useDocsLayoutV2).mockReturnValue(false)
    sectionTop.value = 500
    const { rerender } = render(renderPage())

    sectionTop.value = 900
    vi.mocked(useDocsLayoutV2).mockReturnValue(true)
    rerender(renderPage())

    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 840)
  })
})
