import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ENABLED_STORAGE_KEY, VALUES_STORAGE_KEY } from './constants'

declare global {
  interface Window {
    devColors?: () => void
  }
}

const originalEnv = process.env.NEXT_PUBLIC_ENVIRONMENT

function mockComputedStyle(vars: Record<string, string> = {}) {
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    getPropertyValue: (name: string) => vars[name] ?? '0',
  } as CSSStyleDeclaration)
}

async function flushAnimationFrames() {
  await act(async () => {
    await new Promise(requestAnimationFrame)
    await new Promise(requestAnimationFrame)
  })
}

async function renderColorTinker() {
  const { ColorTinkerProvider } = await import('./ColorTinkerContext')
  const { ColorSystemTinker } = await import('./ColorSystemTinker')
  const { TooltipProvider } = await import('ui')

  return render(
    <TooltipProvider>
      <ColorTinkerProvider>
        <ColorSystemTinker />
      </ColorTinkerProvider>
    </TooltipProvider>
  )
}

describe('ColorTinker', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    const localStorageMock = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
      clear: () => {
        store.clear()
      },
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size
      },
    }

    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    localStorage.clear()
    delete window.devColors
    document.documentElement.style.cssText = ''
    mockComputedStyle({
      '--surface-hue': '155',
      '--primary-hue': '155',
      '--surface': '0.2',
      '--elevation-step': '0.01',
      '--chroma': '0.03',
      '--contrast': '0.5',
    })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_ENVIRONMENT
    } else {
      process.env.NEXT_PUBLIC_ENVIRONMENT = originalEnv
    }
    vi.resetModules()
    vi.restoreAllMocks()
  })

  describe('when not in local or staging', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'prod'
    })

    it('does not render the trigger button', async () => {
      vi.resetModules()
      localStorage.setItem(ENABLED_STORAGE_KEY, 'true')
      const { container } = await renderColorTinker()

      expect(container.querySelector('button')).toBeNull()
    })

    it('does not register window.devColors', async () => {
      vi.resetModules()
      await renderColorTinker()

      expect(window.devColors).toBeUndefined()
    })
  })

  describe('when in local development but not enabled', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'local'
    })

    it('does not render the trigger when not enabled', async () => {
      vi.resetModules()
      const { container } = await renderColorTinker()

      expect(container.querySelector('button')).toBeNull()
    })

    it('registers window.devColors', async () => {
      vi.resetModules()
      await renderColorTinker()

      expect(window.devColors).toBeDefined()
      expect(typeof window.devColors).toBe('function')
    })
  })

  describe('when in local development and enabled', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'local'
      localStorage.setItem(ENABLED_STORAGE_KEY, 'true')
    })

    it('renders the trigger button when enabled via localStorage', async () => {
      vi.resetModules()
      await renderColorTinker()

      expect(screen.getByRole('button', { name: 'Color system tinker' })).toBeInTheDocument()
    })

    it('opens the panel when the trigger is clicked', async () => {
      vi.resetModules()
      const user = userEvent.setup()
      await renderColorTinker()
      await flushAnimationFrames()

      await user.click(screen.getByRole('button', { name: 'Color system tinker' }))

      await waitFor(() => {
        expect(screen.getByText('Theme')).toBeInTheDocument()
        expect(screen.getByText('Surface hue')).toBeInTheDocument()
        expect(screen.getByText('Brand hue')).toBeInTheDocument()
      })
    })
  })

  describe('when in staging environment and enabled', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'staging'
      localStorage.setItem(ENABLED_STORAGE_KEY, 'true')
    })

    it('renders the trigger button', async () => {
      vi.resetModules()
      await renderColorTinker()

      expect(screen.getByRole('button', { name: 'Color system tinker' })).toBeInTheDocument()
    })
  })

  describe('window.devColors function', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'local'
    })

    it('enables the color tinker when called', async () => {
      vi.resetModules()
      await renderColorTinker()

      expect(screen.queryByRole('button', { name: 'Color system tinker' })).toBeNull()

      act(() => {
        window.devColors?.()
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Color system tinker' })).toBeInTheDocument()
      })
      expect(localStorage.getItem(ENABLED_STORAGE_KEY)).toBe('true')
    })

    it('removes window.devColors on unmount', async () => {
      vi.resetModules()
      const { unmount } = await renderColorTinker()

      expect(window.devColors).toBeDefined()
      unmount()
      expect(window.devColors).toBeUndefined()
    })
  })

  describe('dismiss behavior', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'local'
      localStorage.setItem(ENABLED_STORAGE_KEY, 'true')
    })

    it('clears CSS overrides and hides the trigger when dismissed', async () => {
      vi.resetModules()
      localStorage.setItem(
        VALUES_STORAGE_KEY,
        JSON.stringify({
          dark: {
            '--surface-hue': 200,
            '--primary-hue': 200,
            '--surface': 0.3,
            '--elevation-step': 0.01,
            '--chroma': 0.03,
            '--contrast': 0.5,
          },
        })
      )

      const user = userEvent.setup()
      await renderColorTinker()
      await flushAnimationFrames()

      await waitFor(() => {
        expect(document.documentElement.style.getPropertyValue('--surface-hue')).toBe('200')
      })

      await user.click(screen.getByRole('button', { name: 'Color system tinker' }))
      await user.click(screen.getByRole('button', { name: 'Hide color tinker' }))

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Color system tinker' })).toBeNull()
      })
      expect(document.documentElement.style.getPropertyValue('--surface-hue')).toBe('')
      expect(localStorage.getItem(ENABLED_STORAGE_KEY)).toBeNull()
    })
  })
})
