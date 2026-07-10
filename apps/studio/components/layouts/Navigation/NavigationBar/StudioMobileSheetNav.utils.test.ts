import { describe, expect, it, vi } from 'vitest'

import { preventFloatingToolbarDismiss } from './StudioMobileSheetNav.utils'

describe('preventFloatingToolbarDismiss', () => {
  it('prevents the sheet from dismissing when a toolbar descendant is clicked', () => {
    const toolbar = document.createElement('nav')
    const button = document.createElement('button')
    toolbar.dataset.floatingMobileToolbar = ''
    toolbar.appendChild(button)
    const preventDefault = vi.fn()

    preventFloatingToolbarDismiss({ target: button, preventDefault })

    expect(preventDefault).toHaveBeenCalledOnce()
  })

  it('allows other outside interactions to dismiss the sheet', () => {
    const preventDefault = vi.fn()

    preventFloatingToolbarDismiss({ target: document.createElement('button'), preventDefault })

    expect(preventDefault).not.toHaveBeenCalled()
  })
})
