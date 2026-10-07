import { SupportCategories } from '@supabase/shared-types/out/constants'
import { screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { AlertError } from './AlertError'
import { createSupportFormUrl } from '@/components/interfaces/Support/SupportForm.utils'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))

test('support is an inline link with the error context, not an action button', () => {
  customRender(
    <AlertError projectRef="default" subject="Failed to load" error={{ message: 'Test error' }} />
  )
  expect(screen.getByRole('link', { name: 'contact support' })).toHaveAttribute(
    'href',
    createSupportFormUrl({
      category: SupportCategories.DASHBOARD_BUG,
      projectRef: 'default',
      subject: 'Failed to load',
      error: 'Test error',
    })
  )
  expect(screen.queryByRole('button', { name: /contact support/i })).not.toBeInTheDocument()
})
test('custom support prose links unless support is hidden', () => {
  const { rerender } = customRender(
    <AlertError description="Please contact support for assistance." />
  )
  expect(screen.getByRole('link', { name: 'contact support' })).toBeInTheDocument()
  rerender(<AlertError description="Please contact support for assistance." hideContactSupport />)
  expect(screen.queryByRole('link', { name: 'contact support' })).not.toBeInTheDocument()
  expect(screen.getByText('Please contact support for assistance.')).toBeInTheDocument()
})

test.each([false, true])(
  'keeps support available with custom instructions (hidden: %s)',
  (hidden) => {
    const { rerender } = customRender(
      <AlertError description="Refresh the page." showInstructions={!hidden} />
    )
    expect(screen.getByRole('link', { name: 'Contact support' })).toBeInTheDocument()
    rerender(
      <AlertError description="Refresh the page." showInstructions={!hidden} hideContactSupport />
    )
    expect(screen.queryByRole('link', { name: /contact support/i })).not.toBeInTheDocument()
  }
)
