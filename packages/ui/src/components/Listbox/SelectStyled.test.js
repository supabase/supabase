import React from 'react'
import { render, screen } from '@testing-library/react'
import Select from './Listbox'

describe('#Select', () => {
  it('should render select correctly', async () => {
    render(
      <Select data-testid="form-select">
        <option>1</option>
        <option>2</option>
      </Select>
    )
    expect(screen.queryByTestId('form-select')).toBeInTheDocument()
  })

  it('should have "form-select--error" class', () => {
    render(
      <Select isError data-testid="form-select">
        <option>1</option>
        <option>2</option>
      </Select>
    )
    expect(screen.queryByTestId('form-select')).toHaveClass(
      'form-select border-solid form-select--error'
    )
  })
})
