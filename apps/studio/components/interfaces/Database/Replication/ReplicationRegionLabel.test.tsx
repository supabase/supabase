import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { ReplicationRegionLabel } from './ReplicationRegionLabel'
import { customRender } from '@/tests/lib/custom-render'

test('shows the name and flag for a recognized configured region', () => {
  const { container } = customRender(<ReplicationRegionLabel code="us-east-1" />)

  expect(screen.getByText('East US (North Virginia)')).toBeVisible()
  expect(container.querySelector('img')).toHaveAttribute('src', '/img/regions/us-east-1.svg')
})

test('keeps custom storage regions as configured without an inferred flag', () => {
  const { container } = customRender(<ReplicationRegionLabel code="custom-storage-region" />)

  expect(screen.getByText('custom-storage-region')).toBeVisible()
  expect(container.querySelector('img')).toBeNull()
})
