import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SkipToContent } from './SkipToContent'

describe('SkipToContent', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
    vi.restoreAllMocks()
  })

  it('preserves the current fragment and moves keyboard focus to the landmark', async () => {
    window.history.replaceState(null, '', '/#v1=dashboard-definition')
    const scrollIntoView = vi.fn()
    render(
      <>
        <SkipToContent href="#main" />
        <main id="main" tabIndex={-1}>
          Dashboard content
        </main>
      </>
    )
    const main = screen.getByRole('main')
    main.scrollIntoView = scrollIntoView
    const user = userEvent.setup()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(main).toHaveFocus()
    expect(window.location.hash).toBe('#v1=dashboard-definition')
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' })
  })

  it('renders a link with the provided href and default label', () => {
    render(<SkipToContent href="#main" />)

    const link = screen.getByRole('link', { name: 'Skip to content' })
    expect(link).toHaveAttribute('href', '#main')
  })

  it('allows a custom label', () => {
    render(<SkipToContent href="#docs-content">Skip to docs</SkipToContent>)

    expect(screen.getByRole('link', { name: 'Skip to docs' })).toHaveAttribute(
      'href',
      '#docs-content'
    )
  })

  it('is off-screen until keyboard focus and slides in on focus-within', () => {
    const { container } = render(<SkipToContent href="#main" />)

    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.className).toContain('-translate-y-[calc(100%+8px)]')
    expect(wrapper.className).toContain('focus-within:translate-y-[10px]')
    expect(wrapper.className).toContain('w-fit')
    expect(wrapper.className).toContain('left-[10px]')
  })

  it('uses the default Button surface without custom overrides', () => {
    render(<SkipToContent href="#main" />)

    const link = screen.getByRole('link', { name: 'Skip to content' })
    expect(link.className).toContain('raised-control-surface')
    expect(link.className).toContain('control-surface-shadows')
    expect(link.className).not.toContain('bg-surface-300')
    expect(link.className).not.toContain('hover:bg-secondary')
  })
})
