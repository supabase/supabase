import React from 'react'
import { render, screen } from '@testing-library/react'
import Button, { SIZES, VARIANTS } from './Button'

describe('#Button', () => {
  it('should render button correctly', async () => {
    render(<Button>Button</Button>)
    expect(screen.queryByText('Button')).toBeInTheDocument()
  })

  it('should have "w-full" class', async () => {
    render(<Button block>Button Block</Button>)
    expect(screen.queryByRole('button')).toHaveClass('btn w-full btn--medium')
  })

  it.each(VARIANTS)('should have "btn--%s" class', (variant) => {
    render(<Button variant={variant}>Button Variant</Button>)
    expect(screen.queryByRole('button')).toHaveClass(
      `btn btn--medium btn--${variant}`
    )
  })

  it.each(SIZES)('should have "btn--%s" class', (size) => {
    render(<Button size={size}>Button</Button>)
    expect(screen.queryByRole('button')).toHaveClass(`btn btn--${size}`)
  })
})
