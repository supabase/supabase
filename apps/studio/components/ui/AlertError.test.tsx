import { SupportCategories } from '@supabase/shared-types/out/constants'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from 'ui'
import { expect, test, vi } from 'vitest'

import { AlertError } from './AlertError'
import { createSupportFormUrl } from '@/components/interfaces/Support/SupportForm.utils'
import { takeBreadcrumbSnapshot } from '@/lib/breadcrumbs'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))
vi.mock('@/lib/breadcrumbs', () => ({ takeBreadcrumbSnapshot: vi.fn() }))

test('explicit responsive layout survives additional actions', () => {
  customRender(<AlertError layout="responsive" additionalActions={<Button>Retry</Button>} />)
  expect(screen.getByRole('alert')).toHaveClass('@container')
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
})

test('hiding support removes its wording from the default instructions', () => {
  customRender(<AlertError hideContactSupport />)
  expect(screen.getByText('Try refreshing your browser.')).toBeInTheDocument()
  expect(screen.queryByText(/contact support/i)).not.toBeInTheDocument()
})

test('support is an inline link with the error context, not an action button', async () => {
  const user = userEvent.setup()
  customRender(
    <AlertError projectRef="default" subject="Failed to load" error={{ message: 'Test error' }} />
  )
  expect(screen.getByRole('link', { name: 'contact support' })).toHaveAttribute(
    'href',
    createSupportFormUrl({
      category: SupportCategories.DASHBOARD_BUG,
      projectRef: 'default',
      subject: 'Failed to load',
      errorMessage: 'Test error',
    })
  )
  expect(screen.queryByRole('button', { name: /contact support/i })).not.toBeInTheDocument()
  await user.click(screen.getByRole('link', { name: 'contact support' }))
  expect(takeBreadcrumbSnapshot).toHaveBeenCalledOnce()
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
