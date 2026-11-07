import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { WarehouseObservabilitySection } from './WarehouseObservabilitySection'
import { customRender } from '@/tests/lib/custom-render'

describe('WarehouseObservabilitySection', () => {
  test('links to the Warehouse metrics page for the current project', () => {
    customRender(<WarehouseObservabilitySection />)
    expect(screen.getByRole('link', { name: 'View metrics' })).toHaveAttribute(
      'href',
      '/project/default/observability/warehouse'
    )
  })
})
