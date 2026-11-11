import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '../shadcn/ui/tooltip'
import { CopyHeadingLinkButton } from './CopyHeadingLinkButton'

const writeText = vi.fn<(text: string) => Promise<void>>()

const renderButton = () =>
  render(
    <TooltipProvider>
      <CopyHeadingLinkButton id="usage" />
    </TooltipProvider>
  )

const clickButton = () =>
  fireEvent.click(screen.getByRole('link', { name: 'Copy link to section' }))

const copySectionLink = () => {
  renderButton()
  clickButton()
}

describe('CopyHeadingLinkButton', () => {
  beforeEach(() => {
    writeText.mockReset().mockResolvedValue()
    vi.spyOn(document, 'hasFocus').mockReturnValue(true)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    window.history.replaceState(null, '', '/report?interval=1d#previous')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('copies the current url with the section hash and keeps the query string', async () => {
    copySectionLink()

    await vi.waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/report?interval=1d#usage`)
    )
  })

  it('links to the section, so a click also moves to it', () => {
    renderButton()

    expect(screen.getByRole('link', { name: 'Copy link to section' })).toHaveAttribute(
      'href',
      '#usage'
    )
  })

  it('announces the copy to screen readers only after a click', async () => {
    renderButton()
    expect(screen.getByRole('status')).toHaveTextContent('')

    clickButton()

    expect(await screen.findByRole('status')).toHaveTextContent('Link copied')
  })

  it('clears the copied state after two seconds, so the next copy is announced again', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    copySectionLink()
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(screen.getByRole('status')).toHaveTextContent('Link copied')

    await act(() => vi.advanceTimersByTimeAsync(2000))

    expect(screen.getByRole('status')).toHaveTextContent('')
  })

  it('restarts the two second wait when the link is copied again', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    copySectionLink()
    await act(() => vi.advanceTimersByTimeAsync(1000))
    clickButton()
    await act(() => vi.advanceTimersByTimeAsync(1500))

    expect(screen.getByRole('status')).toHaveTextContent('Link copied')
  })
})
