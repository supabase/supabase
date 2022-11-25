import React from from 'react';
import { render, screen } from '@testing-library/react';
import Breadcrumb from './Breadcrumb';

describe('#Breadcrumb', () => {
  it('should render breadcrumb correctly', async () => {
    render(
      <Breadcrumb data-testid="breadcrumb">
        <p> Item 1 </p>
        <p> Item 2 </p>
      </Breadcrumb>
    )
    expect(screen.queryByTestId('breadcrumb')).toBeInTheDocument()
  })

  it('should have "breadcrumb--item" class', () => {
    render(
      <Breadcrumb data-testid="breadcrumb">
        <p> Item 1 </p>
        <p> Item 2 </p>
      </Breadcrumb>
    )
    expect(screen.queryByTestId('breadcrumb')).toHaveClass('.sbui-breadcrumb--item ')
  })
})
