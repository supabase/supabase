import { render } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { DestinationIcon } from './DestinationIcon'
import type { DestinationType } from './DestinationPanel/DestinationPanel.types'

const DESTINATION_TYPES: DestinationType[] = [
  'Read Replica',
  'BigQuery',
  'Analytics Bucket',
  'DuckLake',
  'Snowflake',
  'ClickHouse',
]

describe('DestinationIcon', () => {
  test.each(DESTINATION_TYPES)('renders %s at the canonical stroke width', (type) => {
    const { container } = render(<DestinationIcon type={type} size={20} />)

    expect(container.querySelector('svg')).toHaveAttribute('stroke-width', '1.5')
  })
})
