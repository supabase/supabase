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
