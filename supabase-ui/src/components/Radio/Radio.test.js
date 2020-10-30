import React from 'react'
import { render, screen } from '@testing-library/react'
import Radio from './Radio'

describe('#Radio', () => {
  it('should render radio correctly', () => {
    render(
      <Radio data-testid="form-radio" />
    )
    expect(screen.queryByTestId('form-radio')).toBeInTheDocument()
  })

  it('should show label', () => {
    render(
      <Radio data-testid="form-radio" label="JavaScript" />
    )
    expect(screen.queryByText('JavaScript')).toBeInTheDocument()
  })
})