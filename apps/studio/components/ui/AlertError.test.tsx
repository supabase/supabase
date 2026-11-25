import { SupportCategories } from '@supabase/shared-types/out/constants'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from 'ui'
import { expect, test, vi } from 'vitest'

import { AlertError } from './AlertError'
import { OFFLINE_MESSAGE, USER_FAULT_DESCRIPTION } from './AlertError.utils'
import { createSupportFormUrl } from '@/components/interfaces/Support/SupportForm.utils'
import { takeBreadcrumbSnapshot } from '@/lib/breadcrumbs'
import {
  NetworkUnreachableError,
  PlatformError,
  StudioSqlError,
  UserSqlError,
} from '@/lib/errors/studio-errors'
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

test('support continues the error message inline when instructions are hidden', () => {
  customRender(
    <AlertError showInstructions={false} showErrorPrefix={false} error={{ message: 'oh no' }} />
  )
  const link = screen.getByRole('link', { name: 'contact support' })
  expect(link.closest('p')).toHaveTextContent('oh no. If the issue persists, contact support.')
  expect(screen.queryByRole('link', { name: 'Contact support' })).not.toBeInTheDocument()
})

test('shows request and event IDs and a copy button for a tagged error', () => {
  const error = new PlatformError({ message: 'Bad gateway', code: 502, requestId: 'req-123' })
  error.errorEventId = 'evt-456'
  customRender(<AlertError error={error} subject="Failed to load" />)
  expect(screen.getByText('Request ID:')).toBeInTheDocument()
  expect(screen.getByText('req-123')).toBeInTheDocument()
  expect(screen.getByText('Event ID (before sampling):')).toBeInTheDocument()
  expect(screen.getByText('evt-456')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Copy details' })).toBeInTheDocument()
})

test('omits identifiers that are absent on a tagged error', () => {
  customRender(<AlertError error={new PlatformError({ message: 'Bad gateway' })} />)
  expect(screen.queryByText(/Request ID/)).not.toBeInTheDocument()
  expect(screen.queryByText(/Event ID/)).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Copy details' })).toBeInTheDocument()
})

test('a plain error has no identifiers and no copy button', () => {
  customRender(<AlertError error={{ message: 'plain' }} />)
  expect(screen.queryByText(/Request ID|Event ID/)).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Copy details' })).not.toBeInTheDocument()
})

test('copy details sits alongside additional actions', () => {
  customRender(
    <AlertError error={new PlatformError({})} additionalActions={<Button>Retry</Button>} />
  )
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Copy details' })).toBeInTheDocument()
})

test('offline shows a dedicated message with no support, event ID or copy button', () => {
  const error = new NetworkUnreachableError({ message: 'Unable to reach', reason: 'offline' })
  error.errorEventId = 'evt-1'
  customRender(<AlertError error={error} />)
  expect(screen.getByText(OFFLINE_MESSAGE)).toBeInTheDocument()
  expect(screen.queryByText(/Error:/)).not.toBeInTheDocument()
  expect(screen.queryByText(/contact support/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/Event ID/)).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Copy details' })).not.toBeInTheDocument()
})

test('a user-fault error says to try again, with no support, identifiers or copy button', () => {
  const error = new UserSqlError({ message: 'permission denied for table todos', requestId: 'r1' })
  error.errorEventId = 'evt-2'
  customRender(<AlertError error={error} />)
  expect(screen.getByText('Error: permission denied for table todos')).toBeInTheDocument()
  expect(screen.getByText(USER_FAULT_DESCRIPTION)).toBeInTheDocument()
  expect(screen.queryByText(/^Try refreshing your browser/)).not.toBeInTheDocument()
  expect(screen.queryByText(/contact support/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/Request ID|Event ID/)).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Copy details' })).not.toBeInTheDocument()
})

test('Studio SQL that failed on user input (user_input) gets the user-fault presentation', () => {
  const error = new StudioSqlError({
    message: 'invalid input syntax for type integer: "abc"',
    reason: 'user_input',
    requestId: 'r3',
  })
  error.errorEventId = 'evt-3'
  customRender(<AlertError error={error} />)
  expect(screen.getByText(USER_FAULT_DESCRIPTION)).toBeInTheDocument()
  expect(screen.queryByText(/Request ID|Event ID/)).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Copy details' })).not.toBeInTheDocument()
})

test('caller props win over the tag defaults', () => {
  const error = new UserSqlError({ message: 'x' })
  customRender(<AlertError error={error} description="Custom." />)
  expect(screen.getByText('Custom.')).toBeInTheDocument()
  expect(screen.queryByText(USER_FAULT_DESCRIPTION)).not.toBeInTheDocument()
})
