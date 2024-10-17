import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import Breadcrumb from './Breadcrumb';

describe('#Breadcrumb', () => {
  it.skip('should render breadcrumb correctly', async () => {
    render(
      <Breadcrumb data-testid="breadcrumb">
        <p> Item 1 </p>
        <p> Item 2 </p>
      </Breadcrumb>
    )
    expect(screen.queryByTestId('breadcrumb')).toBeInTheDocument()
  })

  it.skip('should have "breadcrumb--item" class', () => {
    render(
      <Breadcrumb data-testid="breadcrumb">
        <p> Item 1 </p>
        <p> Item 2 </p>
      </Breadcrumb>
    )
    expect(screen.queryByTestId('breadcrumb')).toHaveClass('.sbui-breadcrumb--item ')
  })
})
