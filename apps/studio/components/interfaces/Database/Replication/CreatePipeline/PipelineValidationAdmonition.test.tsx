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

test('shows each issue without redundant severity badges', () => {
  customRender(
    <PipelineValidationAdmonition
      failures={[
        { name: 'Credentials', reason: 'Replace the key.', failure_type: 'critical' },
        { name: 'Replica identity', reason: 'Review table settings.', failure_type: 'warning' },
      ]}
    />
  )
  expect(screen.getByText('Credentials (required)').parentElement).toHaveTextContent(
    'Replace the key.'
  )
  expect(screen.getByText('Replica identity (warning)').parentElement).toHaveTextContent(
    'Review table settings.'
  )
  expect(screen.queryByText('Required')).not.toBeInTheDocument()
  expect(screen.queryByText('Warning')).not.toBeInTheDocument()
})

test('uses compact prose and sentence case without a redundant list', () => {
  customRender(
    <PipelineValidationAdmonition
      stale
      failures={[
        {
          name: 'BigQuery Dataset Not Found',
          reason: 'The dataset was not found.\n\nCheck the project and dataset names.',
          failure_type: 'critical',
        },
      ]}
    />
  )
  expect(screen.getByText('BigQuery dataset not found')).toBeInTheDocument()
  expect(screen.getByText('The dataset was not found.').parentElement).toHaveTextContent(
    'The dataset was not found. Check the project and dataset names.'
  )
  expect(screen.getByText('Settings changed. Test the connection again.')).toBeInTheDocument()
  expect(screen.queryByRole('list')).not.toBeInTheDocument()
})

test('preserves Markdown lists', () => {
  customRender(
    <PipelineValidationAdmonition
      failures={[
        {
          name: 'Credentials',
          reason: 'Check these settings:\n\n- Project ID\n- Dataset ID',
          failure_type: 'critical',
        },
      ]}
    />
  )
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
})
