import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './Button'

const SIZES = ['tiny', 'small', 'medium', 'large', 'xlarge'] as const
const TYPES = [
  'primary',
  'default',
  'secondary',
  'alternative',
  'outline',
  'dashed',
  'link',
  'text',
  'danger',
  'warning',
] as const

describe('#Button', () => {
  it('should render button correctly', () => {
    const wrapper = render(<Button>Button</Button>)

    expect(wrapper.getByText('Button')).toBeInTheDocument()
    expect(() => wrapper.unmount()).not.toThrow()
  })

  it('should default to the neutral default variant', () => {
    render(<Button>Neutral</Button>)

    const button = screen.getByRole('button', { name: 'Neutral' })
    expect(button.className).toContain('bg-background')
    expect(button.className).toContain('hover:bg-popover')
    expect(button.className).not.toContain('bg-brand-400')
  })

  it('should allow an explicit primary variant override', () => {
    render(<Button variant="primary">Primary</Button>)

    const button = screen.getByRole('button', { name: 'Primary' })
    expect(button.className).toContain('bg-brand-400')
  })

  it('should render different text', () => {
    const wrapper = render(<Button>Button</Button>)

    expect(screen.getByText('Button')).toBeInTheDocument()

    wrapper.rerender(<Button>按钮</Button>)

    expect(screen.getByText('按钮')).toBeInTheDocument()
  })

  it('should use native disabled when loading by default', () => {
    render(<Button loading>Button</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('should remain focusable and ignore events when disabled with focusableWhenDisabled', () => {
    const WrapperButton = () => {
      const [state, setState] = React.useState('state1')
      return (
        <Button disabled focusableWhenDisabled onClick={() => setState('state2')}>
          {state}
        </Button>
      )
    }

    render(<WrapperButton />)
    const button = screen.getByRole('button', { name: 'state1' })

    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).not.toBeDisabled()
    expect(button).toHaveAttribute('tabIndex', '0')

    fireEvent.click(button)

    expect(screen.getByText('state1')).toBeInTheDocument()
    expect(screen.queryByText('state2')).not.toBeInTheDocument()
  })

  it('should ignore child onClick when focusably disabled with asChild', () => {
    const childOnClick = vi.fn()
    const buttonOnClick = vi.fn()

    render(
      <Button asChild disabled focusableWhenDisabled onClick={buttonOnClick}>
        <a href="/foo" onClick={childOnClick}>
          Link
        </a>
      </Button>
    )

    fireEvent.click(screen.getByRole('link'))

    expect(childOnClick).not.toHaveBeenCalled()
    expect(buttonOnClick).not.toHaveBeenCalled()
  })

  it('should not call Button onClick when asChild child calls preventDefault', () => {
    const childOnClick = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const buttonOnClick = vi.fn()

    render(
      <Button asChild onClick={buttonOnClick}>
        <a href="/foo" onClick={childOnClick}>
          Link
        </a>
      </Button>
    )

    fireEvent.click(screen.getByRole('link'))

    expect(childOnClick).toHaveBeenCalled()
    expect(buttonOnClick).not.toHaveBeenCalled()
  })

  it('should ignore events when disabled', () => {
    const WrapperButton = () => {
      const [state, setState] = React.useState('state1')
      return (
        <Button disabled onClick={() => setState('state2')}>
          {state}
        </Button>
      )
    }

    render(<WrapperButton />)
    expect(screen.getByText('state1')).toBeInTheDocument()

    fireEvent.click(screen.getByText('state1'))

    expect(screen.getByText('state1')).toBeInTheDocument()
    expect(screen.queryByText('state2')).not.toBeInTheDocument()
  })

  it('should ignore events when loading', () => {
    const WrapperButton = () => {
      const [state, setState] = React.useState('state1')
      return (
        <Button loading onClick={() => setState('state2')}>
          {state}
        </Button>
      )
    }
    render(<WrapperButton />)
    fireEvent.click(screen.getByText('state1'))
    expect(screen.queryByText('state2')).not.toBeInTheDocument()
  })

  it('should have "w-full" class when block is true', async () => {
    render(<Button block>Button Block</Button>)
    expect(screen.queryByRole('button')).toHaveClass('w-full')
  })

  it('should hide decorative icons from assistive technology', () => {
    render(<Button icon={<svg data-testid="button-icon" />}>Save</Button>)

    expect(screen.getByTestId('button-icon').parentElement).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('should forward ref', () => {
    const ref: React.MutableRefObject<HTMLButtonElement | null> = {
      current: null,
    }

    render(<Button ref={ref}>Button</Button>)

    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })
})
