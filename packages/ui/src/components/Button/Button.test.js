import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from './Button'

const SIZES = ['tiny', 'small', 'medium', 'large', 'xlarge']
const TYPES = [
  'primary',
  'default',
  'secondary',
  'outline',
  'dashed',
  'link',
  'text',
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

  it('should have "w-full" class', async () => {
    render(<Button block>Button Block</Button>)
    expect(screen.queryByRole('button')).toHaveClass(
      'sbui-btn sbui-btn-primary sbui-btn--w-full sbui-btn-container--shadow sbui-btn--tiny'
    )
  })

  it.each(TYPES)('should have "btn--%s" class', (type) => {
    render(<Button type={type}>Button Variant</Button>)

    if (type !== 'text' && type !== 'link') {
      expect(screen.queryByRole('button')).toHaveClass(
        `sbui-btn sbui-btn-${type} sbui-btn-container--shadow sbui-btn--tiny`
      )
    } else {
      expect(screen.queryByRole('button')).toHaveClass(
        `sbui-btn sbui-btn-${type} sbui-btn--tiny`
      )
    }
  })

  it.each(SIZES)('should have "btn--%s" class', (size) => {
    render(<Button size={size}>Button</Button>)
    expect(screen.queryByRole('button')).toHaveClass(
      `sbui-btn sbui-btn-primary sbui-btn-container--shadow sbui-btn--${size}`
    )
  })
})
