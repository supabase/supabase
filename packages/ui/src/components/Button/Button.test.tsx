import { fireEvent, render, screen } from '@testing-library/react'
import Link from 'next/link'
import React from 'react'
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

  it('should render different text', () => {
    const wrapper = render(<Button>Button</Button>)

    expect(screen.getByText('Button')).toBeInTheDocument()

    wrapper.rerender(<Button>按钮</Button>)

    expect(screen.getByText('按钮')).toBeInTheDocument()
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

  it("shouldn't crash when wrapped with next/link", () => {
    expect(() =>
      render(
        <Button asChild>
          <Link href="https://supabase.com">Button</Link>
        </Button>
      )
    ).not.toThrow()
  })

  it('should forward ref', () => {
    const ref: React.MutableRefObject<HTMLButtonElement | null> = {
      current: null,
    }

    render(<Button ref={ref}>Button</Button>)

    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })
})
