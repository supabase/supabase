import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

declare global {
  interface Window {
    devTelemetry?: () => void
  }
}

// Mock common package
vi.mock('common', async () => {
  return {
    useParams: () => ({ ref: 'default' }),
    useFeatureFlags: () => ({
      posthog: {},
      configcat: {},
    }),
    posthogClient: {
      subscribeToEvents: vi.fn(() => () => {}),
    },
    ensurePlatformSuffix: (url: string) => url,
  }
})

const originalEnv = process.env.NODE_ENV

/**
 * Helper to render the full component tree as used in production.
 * The Provider sets up window.devTelemetry and manages state.
 * The Trigger shows the activity icon in the header.
 * The Toolbar is the actual panel/sheet.
 */
async function renderFullToolbar() {
  const { DevToolbarProvider } = await import('./DevToolbarContext')
  const { DevToolbarTrigger } = await import('./DevToolbarTrigger')
  const { DevToolbar } = await import('./DevToolbar')

  return render(
    <DevToolbarProvider apiUrl="http://localhost:3000">
      <DevToolbarTrigger />
      <DevToolbar />
    </DevToolbarProvider>
  )
}

describe('DevToolbar', () => {
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
    delete window.devTelemetry
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    vi.resetModules()
    vi.restoreAllMocks()
  })

  describe('when not in local development', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
    })

    it('returns null and does not render anything', async () => {
      vi.resetModules()
      const { container } = await renderFullToolbar()

      // Neither trigger nor toolbar should render in production
      expect(container.querySelector('button')).toBeNull()
    })

    it('does not register window.devTelemetry', async () => {
      vi.resetModules()
      await renderFullToolbar()

      expect(window.devTelemetry).toBeUndefined()
    })
  })

  describe('when in local development but not enabled', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('does not render trigger when toolbar is not enabled', async () => {
      vi.resetModules()
      const { container } = await renderFullToolbar()

      // Trigger should not render when not enabled
      expect(container.querySelector('button')).toBeNull()
    })

    it('registers window.devTelemetry function', async () => {
      vi.resetModules()
      await renderFullToolbar()

      expect(window.devTelemetry).toBeDefined()
      expect(typeof window.devTelemetry).toBe('function')
    })
  })

  describe('when in local development and enabled', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
      localStorage.setItem('dev-telemetry-toolbar-enabled', 'true')
    })

    it('renders the trigger button when enabled via localStorage', async () => {
      vi.resetModules()
      await renderFullToolbar()

      // The trigger should be a button with the Activity icon
      const triggerButton = screen.getByRole('button')
      expect(triggerButton).toBeInTheDocument()
    })

    it('opens the toolbar sheet when trigger is clicked', async () => {
      vi.resetModules()
      const user = userEvent.setup()
      await renderFullToolbar()

      const triggerButton = screen.getByRole('button')
      await user.click(triggerButton)

      // Sheet should open with the title
      await waitFor(() => {
        expect(screen.getByText('Dev Telemetry')).toBeInTheDocument()
      })
    })

    it('shows Events and Flags tabs in the toolbar', async () => {
      vi.resetModules()
      const user = userEvent.setup()
      await renderFullToolbar()

      const triggerButton = screen.getByRole('button')
      await user.click(triggerButton)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Events/i })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /Flags/i })).toBeInTheDocument()
      })
    })

    it('shows "Local Only" badge in toolbar header', async () => {
      vi.resetModules()
      const user = userEvent.setup()
      await renderFullToolbar()

      const triggerButton = screen.getByRole('button')
      await user.click(triggerButton)

      await waitFor(() => {
        expect(screen.getByText('Local Only')).toBeInTheDocument()
      })
    })
  })

  describe('window.devTelemetry function', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('enables toolbar when called', async () => {
      vi.resetModules()
      const { rerender } = await renderFullToolbar()

      // Trigger should not be visible initially
      expect(screen.queryByRole('button')).not.toBeInTheDocument()

      // Call devTelemetry to enable
      act(() => {
        window.devTelemetry?.()
      })

      // Re-import and rerender to pick up state change
      vi.resetModules()
      const { DevToolbarProvider } = await import('./DevToolbarContext')
      const { DevToolbarTrigger } = await import('./DevToolbarTrigger')
      const { DevToolbar } = await import('./DevToolbar')

      rerender(
        <DevToolbarProvider apiUrl="http://localhost:3000">
          <DevToolbarTrigger />
          <DevToolbar />
        </DevToolbarProvider>
      )

      expect(localStorage.getItem('dev-telemetry-toolbar-enabled')).toBe('true')
    })
  })

  describe('cleanup', () => {
    it('removes window.devTelemetry on unmount', async () => {
      process.env.NODE_ENV = 'development'

      vi.resetModules()
      const result = await renderFullToolbar()

      expect(window.devTelemetry).toBeDefined()

      result.unmount()

      expect(window.devTelemetry).toBeUndefined()
    })
  })

  describe('EventCard keyboard accessibility', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
      localStorage.setItem('dev-telemetry-toolbar-enabled', 'true')
    })

    it('toolbar renders correctly with empty events state', async () => {
      vi.resetModules()

      const user = userEvent.setup()
      await renderFullToolbar()

      const triggerButton = screen.getByRole('button')
      await user.click(triggerButton)

      await waitFor(() => {
        expect(screen.getByText('Dev Telemetry')).toBeInTheDocument()
      })

      // Events tab should be active by default and show empty state
      expect(screen.getByText(/No events yet/i)).toBeInTheDocument()
    })
  })

  describe('Flag override UI', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
      localStorage.setItem('dev-telemetry-toolbar-enabled', 'true')
    })

    it('shows PostHog and ConfigCat sub-tabs in Flags tab', async () => {
      vi.resetModules()
      const user = userEvent.setup()
      await renderFullToolbar()

      const triggerButton = screen.getByRole('button')
      await user.click(triggerButton)

      // Switch to Flags tab
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Flags/i })).toBeInTheDocument()
      })

      const flagsTab = screen.getByRole('tab', { name: /Flags/i })
      await user.click(flagsTab)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /PostHog/i })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /ConfigCat/i })).toBeInTheDocument()
      })
    })
  })
})

describe('DevToolbar utils', () => {
  describe('safeJsonParse', () => {
    it('logs warning for invalid JSON in local environment', async () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = vi.spyOn(console, 'warn')

      vi.resetModules()
      const { safeJsonParse } = await import('./utils')

      const result = safeJsonParse('invalid json', {}, 'test context')

      expect(result).toEqual({})
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DevToolbar] Failed to parse JSON'),
        expect.anything()
      )
    })

    it('returns fallback for undefined input', async () => {
      vi.resetModules()
      const { safeJsonParse } = await import('./utils')

      const result = safeJsonParse(undefined, { default: true })

      expect(result).toEqual({ default: true })
    })

    it('parses valid JSON correctly', async () => {
      vi.resetModules()
      const { safeJsonParse } = await import('./utils')

      const result = safeJsonParse('{"key": "value"}', {})

      expect(result).toEqual({ key: 'value' })
    })
  })

  describe('parseOverrideValue', () => {
    it('preserves number type when original is number', async () => {
      vi.resetModules()
      const { parseOverrideValue } = await import('./utils')

      // String input should be converted to number
      expect(parseOverrideValue('42', 0)).toBe(42)
      expect(parseOverrideValue('3.14', 0)).toBe(3.14)
    })

    it('returns original for invalid number strings', async () => {
      vi.resetModules()
      const { parseOverrideValue } = await import('./utils')

      expect(parseOverrideValue('not a number', 5)).toBe(5)
    })

    it('preserves boolean type', async () => {
      vi.resetModules()
      const { parseOverrideValue } = await import('./utils')

      expect(parseOverrideValue(true, false)).toBe(true)
      expect(parseOverrideValue(false, true)).toBe(false)
    })

    it('preserves string type', async () => {
      vi.resetModules()
      const { parseOverrideValue } = await import('./utils')

      expect(parseOverrideValue('new value', 'original')).toBe('new value')
      expect(parseOverrideValue(123, 'original')).toBe('123')
    })
  })

  describe('valuesAreEqual', () => {
    it('handles number/string comparison', async () => {
      vi.resetModules()
      const { valuesAreEqual } = await import('./utils')

      expect(valuesAreEqual(42, '42')).toBe(true)
      expect(valuesAreEqual('42', 42)).toBe(true)
      expect(valuesAreEqual(42, '43')).toBe(false)
    })

    it('handles boolean comparison strictly', async () => {
      vi.resetModules()
      const { valuesAreEqual } = await import('./utils')

      expect(valuesAreEqual(true, true)).toBe(true)
      expect(valuesAreEqual(false, false)).toBe(true)
      expect(valuesAreEqual(true, false)).toBe(false)
    })

    it('handles null values', async () => {
      vi.resetModules()
      const { valuesAreEqual } = await import('./utils')

      expect(valuesAreEqual(null, null)).toBe(true)
      expect(valuesAreEqual(null, 'value')).toBe(false)
      expect(valuesAreEqual('value', null)).toBe(false)
    })
  })
})
