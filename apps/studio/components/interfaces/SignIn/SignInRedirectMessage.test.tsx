import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SignInRedirectMessage } from './SignInRedirectMessage'
import { customRender } from '@/tests/lib/custom-render'

describe('SignInRedirectMessage', () => {
  it('shows our copy for a known reason', () => {
    customRender(<SignInRedirectMessage />, { nuqs: { searchParams: '?reason=profile_conflict' } })

    expect(screen.getByText("We couldn't finish signing you in")).toBeInTheDocument()
    expect(screen.getByText(/conflict with an existing Supabase account/)).toBeInTheDocument()
  })

  it('renders nothing for an unknown reason, so links cannot inject text', () => {
    const { container } = customRender(<SignInRedirectMessage />, {
      nuqs: { searchParams: '?reason=Re-enter your password at example.com' },
    })

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing without a reason', () => {
    const { container } = customRender(<SignInRedirectMessage />)

    expect(container).toBeEmptyDOMElement()
  })
})
