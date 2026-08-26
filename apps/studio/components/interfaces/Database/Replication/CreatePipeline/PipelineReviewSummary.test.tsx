import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { PipelineReviewSummary } from './PipelineReviewSummary'
import { customRender } from '@/tests/lib/custom-render'

const values = {
  name: 'Analytics pipeline',
  publicationName: 'analytics',
  tableSyncCopyMode: 'include_all_tables',
  tableSyncCopyTableIds: [],
  projectId: 'gcp-project',
  datasetId: 'dataset',
} as DestinationPanelSchemaType

describe('PipelineReviewSummary', () => {
  test('jumps to the matching step from each Edit control', () => {
    const onGoToStep = vi.fn()

    customRender(
      <PipelineReviewSummary
        type="BigQuery"
        values={values}
        publications={[]}
        onGoToStep={onGoToStep}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit destination' }))
    expect(onGoToStep).toHaveBeenCalledWith('destination')

    fireEvent.click(screen.getByRole('button', { name: 'Edit connection' }))
    expect(onGoToStep).toHaveBeenCalledWith('connection')

    fireEvent.click(screen.getByRole('button', { name: 'Edit data' }))
    expect(onGoToStep).toHaveBeenCalledWith('data')
  })

  test('does not render a source section', () => {
    customRender(
      <PipelineReviewSummary
        type="BigQuery"
        values={values}
        publications={[]}
        onGoToStep={vi.fn()}
      />
    )

    expect(screen.queryByRole('heading', { name: 'Source' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit destination' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Edit / })).toHaveLength(3)
  })

  test('notes that destination type cannot be changed after creation', () => {
    customRender(
      <PipelineReviewSummary
        type="BigQuery"
        values={values}
        publications={[]}
        onGoToStep={vi.fn()}
      />
    )

    expect(
      screen.getByText('Destination type cannot be changed after creation.')
    ).toBeInTheDocument()
  })

  test('disables Edit while the pipeline is being created', () => {
    customRender(
      <PipelineReviewSummary
        type="BigQuery"
        values={values}
        publications={[]}
        editDisabled
        onGoToStep={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Edit destination' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Edit connection' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Edit data' })).toBeDisabled()
  })

  test('shows connection failures in the connection section', () => {
    const onGoToStep = vi.fn()

    customRender(
      <PipelineReviewSummary
        type="BigQuery"
        values={values}
        publications={[]}
        connectionFailures={[
          {
            name: 'BigQuery Authentication Failed',
            reason: 'The service account key is invalid.',
            failure_type: 'critical',
          },
        ]}
        onGoToStep={onGoToStep}
      />
    )

    expect(screen.getByText('BigQuery Authentication Failed')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Check destination credentials and connection settings, including Advanced settings on this step.'
      )
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Edit connection' }))
    expect(onGoToStep).toHaveBeenCalledWith('connection')
  })
})
