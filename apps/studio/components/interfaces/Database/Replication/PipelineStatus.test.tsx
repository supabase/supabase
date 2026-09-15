import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { PipelineStatePill } from './PipelineStatePill'
import { PipelineStatus } from './PipelineStatus'
import { PipelineStatusRequestStatus } from '@/state/replication-pipeline-request-status'
import { customRender } from '@/tests/lib/custom-render'
import { ResponseError } from '@/types'

describe.each([
  { name: 'list', Component: PipelineStatePill },
  { name: 'detail', Component: PipelineStatus },
])('$name pipeline status', ({ Component }) => {
  test('preserves pending intent if a background status refresh fails', () => {
    customRender(
      <Component
        pipelineStatus={{ name: 'started' }}
        error={new ResponseError('Status unavailable')}
        isLoading={false}
        isError
        isSuccess={false}
        requestStatus={PipelineStatusRequestStatus.StopRequested}
      />
    )
    expect(screen.getByText('Stopping')).toBeInTheDocument()
    expect(screen.queryByText('Unknown')).not.toBeInTheDocument()
  })
})
