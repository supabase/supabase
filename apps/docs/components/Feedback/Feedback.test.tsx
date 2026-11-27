// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TooltipProvider } from 'ui'
import { afterEach, expect, it, vi } from 'vitest'

import { Feedback } from './Feedback'

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useIsLoggedIn: () => false,
}))
vi.mock('~/lib/telemetry', () => ({ useSendTelemetryEvent: () => vi.fn() }))
vi.mock('next/navigation', () => ({ usePathname: () => '/guides/database/prisma' }))

afterEach(() => {
  cleanup()
})

it('moves keyboard focus to the first vote when the user opens feedback', () => {
  render(
    <TooltipProvider>
      <Feedback variant="rail" />
    </TooltipProvider>
  )

  fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }))

  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: "No, this page didn't help" })
  )
})
