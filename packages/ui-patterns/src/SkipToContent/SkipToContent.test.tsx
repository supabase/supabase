import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SkipToContent } from './SkipToContent'

describe('SkipToContent', () => {
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
    expect(wrapper.className).toContain('-translate-y-full')
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
