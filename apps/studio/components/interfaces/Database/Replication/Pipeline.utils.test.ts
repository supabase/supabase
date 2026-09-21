import { describe, expect, test } from 'vitest'

import { getPipelineDisplayState, getRestartRequestStatus } from './Pipeline.utils'
import { PipelineStatusName } from './Replication.constants'
import { PipelineStatusRequestStatus } from '@/state/replication-pipeline-request-status'

describe('restart feedback', () => {
  test.each([PipelineStatusName.STARTED, PipelineStatusName.FAILED])(
    'shows Stopping when an active pipeline (%s) restarts',
    (status) => {
      expect(getPipelineDisplayState(getRestartRequestStatus(status), status).label).toBe(
        'Stopping'
      )
    }
  )

  test.each([
    PipelineStatusName.STOPPED,
    PipelineStatusName.STARTING,
    PipelineStatusName.STOPPING,
    PipelineStatusName.UNKNOWN,
    undefined,
  ])('keeps the backend state for %s', (status) => {
    expect(getRestartRequestStatus(status)).toBe(PipelineStatusRequestStatus.None)
    expect(getPipelineDisplayState(getRestartRequestStatus(status), status)).toEqual(
      getPipelineDisplayState(undefined, status)
    )
  })
})
