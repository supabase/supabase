import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

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

  it('always offers a way to close the window', async () => {
    const user = userEvent.setup()
    const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {})

    customRender(<InterstitialTerminalScreen {...baseCopy} />)
    await user.click(screen.getByRole('button', { name: 'Close window' }))

    expect(closeSpy).toHaveBeenCalledOnce()
    closeSpy.mockRestore()
  })

  it('drops the footer and its separator when there is nothing left for the footer to say', () => {
    const { footer: _footer, ...copyWithoutFooter } = baseCopy
    const { container } = customRender(<InterstitialTerminalScreen {...copyWithoutFooter} />)

    expect(screen.queryByText('You can close this tab.')).not.toBeInTheDocument()
    expect(container.querySelector('[data-orientation="horizontal"]')).not.toBeInTheDocument()
  })

  it('keeps the footer and its separator when there is footer text to show', () => {
    const { container } = customRender(<InterstitialTerminalScreen {...baseCopy} />)

    expect(screen.getByText('You can close this tab.')).toBeInTheDocument()
    expect(container.querySelector('[data-orientation="horizontal"]')).toBeInTheDocument()
  })
})
