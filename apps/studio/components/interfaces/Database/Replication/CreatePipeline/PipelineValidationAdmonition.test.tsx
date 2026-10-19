import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { PipelineValidationAdmonition } from './PipelineValidationAdmonition'
import { customRender } from '@/tests/lib/custom-render'

describe('PipelineValidationAdmonition', () => {
  test('replaces generic warning titles with clearer copy', () => {
    customRender(
      <PipelineValidationAdmonition
        failures={[
          {
            name: 'Warning',
            reason: 'Some tables use replica identity FULL.',
            failure_type: 'warning',
          },
        ]}
      />
    )

    expect(screen.getByText('Review before continuing')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Replication can start, but review these items before continuing. They may affect how changes are applied downstream.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Some tables use replica identity FULL.')).toBeInTheDocument()
  })

  test('keeps specific warning titles from the API', () => {
    customRender(
      <PipelineValidationAdmonition
        failures={[
          {
            name: 'Replica identity mismatch',
            reason: 'Table `public.users` uses replica identity DEFAULT.',
            failure_type: 'warning',
          },
        ]}
      />
    )

    expect(screen.getByText('Replica identity mismatch')).toBeInTheDocument()
  })
})

test('shows critical issues without suggesting replication can start', () => {
  customRender(
    <PipelineValidationAdmonition
      failures={[
        { name: 'Invalid credentials', reason: 'Check your key.', failure_type: 'critical' },
      ]}
    />
  )
  expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  expect(screen.getByText('Check your key.')).toBeInTheDocument()
  expect(screen.queryByText(/Replication can start/)).not.toBeInTheDocument()
})

test('preserves API copy and inline code in compact results', () => {
  customRender(
    <PipelineValidationAdmonition
      failures={[
        {
          name: 'BigQuery dataset not found',
          reason: 'The dataset was not found.\n\nCheck access to project `my-gcp-proj`.',
          failure_type: 'critical',
        },
      ]}
    />
  )
  expect(screen.getByText('BigQuery dataset not found')).toBeInTheDocument()
  expect(screen.getByText('The dataset was not found.')).toBeInTheDocument()
  expect(screen.queryByRole('list')).not.toBeInTheDocument()
  expect(screen.getByText('my-gcp-proj').tagName).toBe('CODE')
  expect(screen.getByText('my-gcp-proj')).toHaveClass('text-code-inline')
})
