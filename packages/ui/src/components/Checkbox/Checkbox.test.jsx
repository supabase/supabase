import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'

import Checkbox from './Checkbox'

describe('#Checkbox', () => {
  it('should render checkbox correctly', () => {
    render(<Checkbox data-testid="form-checkbox" label="labelIsRequired" />)
    expect(screen.queryByTestId('form-checkbox')).toBeInTheDocument()
  })

  it('should show label', () => {
    render(<Checkbox data-testid="form-checkbox" label="JavaScript" />)
    expect(screen.queryByText('JavaScript')).toBeInTheDocument()
  })
})
