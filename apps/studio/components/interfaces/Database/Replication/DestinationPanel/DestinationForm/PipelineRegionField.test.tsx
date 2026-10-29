import { fireEvent, screen } from '@testing-library/react'
import { useForm, useWatch } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, test } from 'vitest'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import {
  getPipelineRegion,
  getPipelineRegionDescription,
  PIPELINE_REGION,
  PipelineRegionField,
  PipelineRegionReadonly,
} from './PipelineRegionField'
import { customRender } from '@/tests/lib/custom-render'

describe('getPipelineRegionDescription', () => {
  test('includes the destination-specific hint', () => {
    expect(getPipelineRegionDescription('BigQuery')).toBe(
      'Choose a nearby BigQuery dataset where possible.'
    )
  })

  test('falls back to a generic destination hint', () => {
    expect(getPipelineRegionDescription()).toBe(
      'Choose a nearby destination region where possible.'
    )
  })
})

describe('PipelineRegionField', () => {
  test('shows the managed region as read-only information, not a combobox', () => {
    customRender(<PipelineRegionField destinationType="BigQuery" />)

    expect(screen.getByText('Pipeline region')).toBeInTheDocument()
    expect(screen.getByText(PIPELINE_REGION.displayName)).toBeInTheDocument()
    expect(screen.getByText(PIPELINE_REGION.code)).toBeInTheDocument()
    expect(screen.queryByText(/All pipelines run from this region/)).not.toBeInTheDocument()
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
  expect(screen.getByText(PIPELINE_REGION.code).parentElement).toHaveClass('w-full')
})

const RegionForm = () => {
  const form = useForm<DestinationPanelSchemaType>({
    defaultValues: { pipelineRegion: 'us-east-1' },
  })
  const region = useWatch({ control: form.control, name: 'pipelineRegion' })
  return (
    <Form {...form}>
      <PipelineRegionField control={form.control} />
      <output>{region}</output>
    </Form>
  )
}

test('keeps the selected pipeline region in the form', async () => {
  customRender(<RegionForm />)
  fireEvent.click(screen.getByRole('combobox'))
  fireEvent.click(await screen.findByRole('option', { name: /Central EU/ }))
  expect(screen.getByRole('status')).toHaveTextContent('eu-central-1')
  expect(screen.getByRole('combobox')).toHaveTextContent('Central EU (Frankfurt)')
})

test('defaults to a supported source region and falls back for unsupported regions', () => {
  expect(getPipelineRegion('us-east-1').code).toBe('us-east-1')
  expect(getPipelineRegion('ap-southeast-2')).toBe(PIPELINE_REGION)
  expect(getPipelineRegion()).toBe(PIPELINE_REGION)
})
