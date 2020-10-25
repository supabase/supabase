import React from 'react'
import { render, screen } from '@testing-library/react'
import Input, { SIZES } from './Input'

describe('#Input', () => {
  it('should render input correctly', async () => {
    render(<Input data-testid="form-input" />)
    expect(screen.queryByTestId('form-input')).toBeInTheDocument()
  })

  it('should have "form-input--error" class', () => {
    render(<Input isError data-testid="form-input" />)
    expect(screen.queryByTestId('form-input')).toHaveClass('form-input border-solid form-input--error')
  })

  it.each(SIZES)('should have "form-input--%s" class', (size) => {
    render(<Input size={size} data-testid="form-input" />)
    expect(screen.queryByTestId('form-input')).toHaveClass(`form-input border-solid form-input--${size}`)
  })
})