import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { KeyboardShortcut } from './KeyboardShortcut'

const originalNavigator = global.navigator

const setNavigator = (platform: string, userAgent: string) => {
  Object.defineProperty(global, 'navigator', {
    configurable: true,
    value: {
      ...originalNavigator,
      platform,
      userAgent,
    },
  })
}

describe('KeyboardShortcut', () => {
  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: originalNavigator,
    })
  })

  it('renders arrow keys as symbols', () => {
    render(<KeyboardShortcut keys={['ArrowUp']} />)

    expect(screen.getByText('↑')).toBeInTheDocument()
  })

  it('renders compact mac-style shortcuts for symbol and single-character keys', () => {
    setNavigator('MacIntel', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)')

    render(<KeyboardShortcut keys={['Meta', 'ArrowUp']} />)

    expect(screen.getByText('⌘↑')).toBeInTheDocument()
  })

  it('keeps word-style non-mac shortcuts readable', () => {
    setNavigator('Linux x86_64', 'Mozilla/5.0 (X11; Linux x86_64)')

    render(<KeyboardShortcut keys={['Meta', 'ArrowUp']} />)

    expect(screen.getByText('Ctrl ↑')).toBeInTheDocument()
  })
})
