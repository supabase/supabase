import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { QuerySourceIcon } from './QuerySourceIcon'

describe('QuerySourceIcon', () => {
  it.each(['database', 'logs'] as const)('renders the %s icon at the standard size', (source) => {
    const { container } = render(<QuerySourceIcon source={source} />)
    const icon = container.querySelector('svg')

    expect(icon).toHaveAttribute('width', '16')
    expect(icon).toHaveAttribute('height', '16')
    expect(icon).toHaveAttribute('stroke-width', '2')
  })
})
