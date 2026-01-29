import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

declare global {
  interface Window {
    devTelemetry?: () => void
  }
}

const originalEnv = process.env.NEXT_PUBLIC_ENVIRONMENT

describe('DevTelemetryToolbar', () => {
  beforeEach(() => {
    localStorage.clear()
    delete window.devTelemetry
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = originalEnv
    vi.resetModules()
    vi.restoreAllMocks()
  })

  describe('when not in local development', () => {
    it('returns null and does not render anything', async () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'production'

      vi.resetModules()
      const { DevTelemetryToolbar } = await import('./DevTelemetryToolbar')

      const { container } = render(<DevTelemetryToolbar />)

      expect(container.firstChild).toBeNull()
    })

    it('does not register window.devTelemetry', async () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'production'

      vi.resetModules()
      const { DevTelemetryToolbar } = await import('./DevTelemetryToolbar')

      render(<DevTelemetryToolbar />)

      expect(window.devTelemetry).toBeUndefined()
    })

    it('does not log console hints in production', async () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'production'
      const consoleSpy = vi.spyOn(console, 'log')

      vi.resetModules()
      const { DevTelemetryToolbar } = await import('./DevTelemetryToolbar')

      render(<DevTelemetryToolbar />)

      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('devTelemetry()'))
    })
  })

  describe('when in local development but not enabled', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'local'
    })

    it('returns null when toolbar is not enabled', async () => {
      vi.resetModules()
      const { DevTelemetryToolbar } = await import('./DevTelemetryToolbar')

      const { container } = render(<DevTelemetryToolbar />)

      expect(container.firstChild).toBeNull()
    })

    it('registers window.devTelemetry function', async () => {
      vi.resetModules()
      const { DevTelemetryToolbar } = await import('./DevTelemetryToolbar')

      render(<DevTelemetryToolbar />)

      expect(window.devTelemetry).toBeDefined()
      expect(typeof window.devTelemetry).toBe('function')
    })

    it('logs hint to enable toolbar in local dev', async () => {
      const consoleSpy = vi.spyOn(console, 'log')

      vi.resetModules()
      const { DevTelemetryToolbar } = await import('./DevTelemetryToolbar')

      render(<DevTelemetryToolbar />)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Tip: Run devTelemetry() in the console to enable the Dev Telemetry Toolbar'
      )
    })
  })

  describe('when in local development and enabled', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'local'
      localStorage.setItem('dev-telemetry-toolbar-enabled', 'true')
    })

    it('renders the toolbar when enabled via localStorage', async () => {
      vi.resetModules()
      const { DevTelemetryToolbar } = await import('./DevTelemetryToolbar')

      render(<DevTelemetryToolbar />)

      expect(screen.getByTitle('Dev Telemetry Toolbar')).toBeInTheDocument()
    })

    it('renders dismiss button', async () => {
      vi.resetModules()
      const { DevTelemetryToolbar } = await import('./DevTelemetryToolbar')

      render(<DevTelemetryToolbar />)

      expect(
        screen.getByTitle('Dismiss toolbar (run devTelemetry() to re-enable)')
      ).toBeInTheDocument()
    })
  })

  describe('window.devTelemetry function', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'local'
    })

    it('enables toolbar when called and logs confirmation', async () => {
      const consoleSpy = vi.spyOn(console, 'log')

      vi.resetModules()
      const { DevTelemetryToolbar } = await import('./DevTelemetryToolbar')

      const { rerender } = render(<DevTelemetryToolbar />)

      expect(screen.queryByTitle('Dev Telemetry Toolbar')).not.toBeInTheDocument()

      window.devTelemetry?.()

      rerender(<DevTelemetryToolbar />)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Dev Telemetry Toolbar enabled! Click the activity icon in the bottom-right.'
      )

      expect(localStorage.getItem('dev-telemetry-toolbar-enabled')).toBe('true')
    })
  })

  describe('cleanup', () => {
    it('removes window.devTelemetry on unmount', async () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = 'local'

      vi.resetModules()
      const { DevTelemetryToolbar } = await import('./DevTelemetryToolbar')

      const { unmount } = render(<DevTelemetryToolbar />)

      expect(window.devTelemetry).toBeDefined()

      unmount()

      expect(window.devTelemetry).toBeUndefined()
    })
  })
})
