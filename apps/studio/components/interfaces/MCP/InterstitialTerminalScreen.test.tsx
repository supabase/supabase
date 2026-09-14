import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { InterstitialTerminalScreen } from './InterstitialTerminalScreen'
import { customRender } from '@/tests/lib/custom-render'

const baseCopy = {
  title: 'Key stored',
  subtitle: 'RESEND_API_KEY is saved for billing-staging.',
  calloutTitle: 'Next step',
  calloutBody: 'Head back to your agent and let it know you finished.',
  footer: 'You can close this tab.',
}

describe('InterstitialTerminalScreen', () => {
  it('links to the project Edge Functions secrets page when a project ref is given', () => {
    customRender(<InterstitialTerminalScreen {...baseCopy} projectRef="abcdefghijklmnopqrst" />)

    expect(screen.getByRole('link', { name: 'Go to Edge Functions secrets' })).toHaveAttribute(
      'href',
      '/project/abcdefghijklmnopqrst/functions/secrets'
    )
  })

  it('omits the Edge Functions secrets link when there is no project to point at', () => {
    customRender(<InterstitialTerminalScreen {...baseCopy} />)

    expect(
      screen.queryByRole('link', { name: 'Go to Edge Functions secrets' })
    ).not.toBeInTheDocument()
  })
})
