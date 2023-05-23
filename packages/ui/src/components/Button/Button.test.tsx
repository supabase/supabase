import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button, ButtonSize, ButtonType } from '../shadcn/updated/Button/Button'
import defaultTheme from '../../lib/theme/defaultTheme'
import Link from 'next/link'

const SIZES: ButtonSize[] = ['tiny', 'small', 'medium', 'large', 'xlarge']
const TYPES: ButtonType[] = [
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
]

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

  it.each(TYPES)(`should have %p class from theme`, (type) => {
    const expected = defaultTheme.button.type[type]

    render(<Button type={type}>Button Variant</Button>)

    expect(screen.queryByRole('button')).toHaveClass(expected)
  })

  it.each(SIZES)('should have %p class from theme', (size) => {
    const expected = defaultTheme.button.size[size]

    render(<Button size={size}>Button</Button>)

    expect(screen.queryByRole('button')).toHaveClass(expected)
  })

  it("shouldn't crash when wrapped with next/link", () => {
    expect(() =>
      render(
        <Link href="https://supabase.com">
          <Button>Button</Button>
        </Link>
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
