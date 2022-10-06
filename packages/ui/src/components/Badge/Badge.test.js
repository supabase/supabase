import React from 'react'
import { render, screen } from '@testing-library/react'
import Badge from './Badge'

const SIZES = ['small', 'large']
const COLORS = [
  'gray',
  'red',
  'yellow',
  'green',
  'blue',
  'indigo',
  'purple',
  'pink'
]

describe('#Badge', () => {
  it('should render component correctly', () => {
    const wrapper = render(<Badge>Badge</Badge>)
    expect(screen.getByText('Badge')).toBeInTheDocument()
    expect(() => wrapper.unmount()).not.toThrow()
  })

  it('should render different text', () => {
    const wrapper = render(<Badge>Badge</Badge>)
    expect(screen.getByText('Badge')).toBeInTheDocument()
    wrapper.rerender(<Badge>徽章</Badge>)
    expect(screen.getByText('徽章')).toBeInTheDocument()
  })

  it('should render with dot', () => {
    const wrapper = render(<Badge dot={true}>Badge</Badge>)
    expect(screen.getByText('Badge')).toBeInTheDocument()
    expect(() => wrapper.unmount()).not.toThrow()
  })

  it.each(COLORS)('should have %s color', (color) => {
    render(<Badge color={color}>{color}</Badge>)
    expect(screen.getByText(color)).toHaveClass(
      `sbui-badge sbui-badge--${color}`
    )
  })

  it.each(SIZES)('should render with %s size', (size) => {
    render(<Badge size={size}>{size}</Badge>)
    expect(screen.getByText(size)).toHaveClass(
      `sbui-badge ${size === 'large' ? 'sbui-badge--large' : ''}`
    )
  })

  it('should render with Classes',()=>{
    render(<Badge className='border-2'>Badge</Badge>)
    expect(screen.getByText('Badge')).toHaveClass('border-2')
  })
})
