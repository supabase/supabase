import { render } from '@testing-library/react'
import { expect, it } from 'vitest'

import { ThresholdZoneLine } from './ThresholdZoneLine'

it.each([
  { isRising: false, expectedPath: 'M 100 20 V 80 H 300' },
  { isRising: true, expectedPath: 'M 100 80 V 20 H 300' },
])(
  'draws a vertical resize connection before continuing right when rising is $isRising',
  ({ isRising, expectedPath }) => {
    const { container } = render(
      <svg>
        <ThresholdZoneLine x={100} y={20} width={200} height={60} isRising={isRising} />
      </svg>
    )

    expect(container.querySelector('path')).toHaveAttribute('d', expectedPath)
  }
)
