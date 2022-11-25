import React from 'react'
import { render, screen } from '@testing-library/react'
import Textarea from './Textarea'

describe('#Textarea', () => {
  it('should render textarea correctly', async () => {
    render(<Textarea data-testid="form-textarea" />)
    expect(screen.queryByTestId('form-textarea')).toBeInTheDocument()
  })

  it('should have "form-textarea--error" class', () => {
    render(<Textarea isError data-testid="form-textarea" />)
    expect(screen.queryByTestId('form-textarea')).toHaveClass('form-textarea border-solid form-textarea--error')
  })
})