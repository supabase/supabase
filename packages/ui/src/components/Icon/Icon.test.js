import React from 'react'
import { render, screen } from '@testing-library/react'
import Icon from './Icon'

describe('#Icon', () => {
  it('should render Icon correctly', () => {
    render(<Icon data-testid="icon" />)
    const $elIcon = screen.queryByTestId('icon')
    expect($elIcon).toBeInTheDocument()
  })

  it('should change svg size', () => {
    render(<Icon data-testid="icon" size={40} />)

    const $elIcon = screen.queryByTestId('icon')
    expect($elIcon.getAttribute('width')).toEqual('40')
    expect($elIcon.getAttribute('height')).toEqual('40')
  })

  it('should change strokeWidth value', () => {
    render(<Icon data-testid="icon" strokeWidth={1} />)

    const $elIcon = screen.queryByTestId('icon')
    expect($elIcon.getAttribute('stroke-width')).toEqual('1')
  })
})
