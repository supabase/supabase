import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import {
  getPipelineRegionDescription,
  PIPELINE_REGION,
  PipelineRegionField,
  PipelineRegionReadonly,
} from './PipelineRegionField'
import { customRender } from '@/tests/lib/custom-render'

describe('getPipelineRegionDescription', () => {
  test('includes the fixed-region note and destination-specific hint', () => {
    expect(getPipelineRegionDescription('BigQuery')).toBe(
      'All pipelines run from this region. Choose a nearby BigQuery dataset where possible.'
    )
  })

  test('falls back to a generic destination hint', () => {
    expect(getPipelineRegionDescription()).toBe(
      'All pipelines run from this region. Choose a nearby destination region where possible.'
    )
  })
})

describe('PipelineRegionField', () => {
  test('shows the managed region as read-only information, not a combobox', () => {
    customRender(<PipelineRegionField destinationType="BigQuery" />)

    expect(screen.getByText('Pipeline region')).toBeInTheDocument()
    expect(screen.getByText(PIPELINE_REGION.displayName)).toBeInTheDocument()
    expect(screen.getByText(PIPELINE_REGION.code)).toBeInTheDocument()
    expect(screen.getByText(/All pipelines run from this region/)).toBeInTheDocument()
    expect(screen.getByText(/nearby BigQuery dataset/)).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})

test('reuses the region display without a form label or description', () => {
  customRender(<PipelineRegionReadonly className="w-full" />)
  expect(screen.getByText(PIPELINE_REGION.displayName)).toBeInTheDocument()
  expect(screen.getByText(PIPELINE_REGION.code)).toBeInTheDocument()
  expect(screen.queryByText('Pipeline region')).not.toBeInTheDocument()
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  expect(screen.getByText(PIPELINE_REGION.code).parentElement).toHaveClass('w-full', 'px-3')
})
