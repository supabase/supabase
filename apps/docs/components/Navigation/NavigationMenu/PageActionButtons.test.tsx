// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { TooltipProvider } from 'ui'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PageActionButtons } from './PageActionButtons'

const renderActions = () =>
  render(
    <TooltipProvider>
      <PageActionButtons />
    </TooltipProvider>
  )

const navigation = vi.hoisted(() => ({ pathname: '/guides/getting-started' }))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('common', () => ({ useSearchParamsShallow: () => new URLSearchParams() }))
vi.mock('~/lib/telemetry', () => ({ useSendTelemetryEvent: () => vi.fn() }))

describe('PageActionButtons', () => {
  afterEach(cleanup)

  it('offers the markdown actions on a guide with a markdown version', () => {
    navigation.pathname = '/guides/getting-started'

    renderActions()

    expect(screen.getByRole('button', { name: 'Copy page' })).toBeTruthy()
  })

  it('hides the markdown actions on a guide without a markdown version', () => {
    navigation.pathname = '/guides/local-development/cli/config'

    renderActions()

    expect(screen.queryByRole('button', { name: 'Copy page' })).toBeNull()
  })
})
