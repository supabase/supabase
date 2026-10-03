import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  applicationId: 'storage' as string | undefined,
  workerId: 0 as number | undefined,
  itcAvailable: true,
}))

vi.mock('@platformatic/globals', () => ({
  getApplicationId: () => mocks.applicationId,
  getITC: () => (mocks.itcAvailable ? { send: mocks.send } : undefined),
  getWorkerId: () => mocks.workerId,
}))

import { manualProfileCaptureMessage, triggerManualProfile } from './trigger'

describe('manual Watt profile trigger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.applicationId = 'storage'
    mocks.workerId = 0
    mocks.itcAvailable = true
    mocks.send.mockResolvedValue({ scheduled: true })
  })

  it.each([
    'cpu',
    'heap',
  ] as const)('sends a manual %s request for the serving Watt worker', async (type) => {
    await expect(triggerManualProfile(type, 30)).resolves.toEqual({ scheduled: true })
    expect(mocks.send).toHaveBeenCalledWith(manualProfileCaptureMessage, {
      application: 'storage',
      worker: 0,
      type,
      seconds: 30,
      reason: 'admin',
    })
  })

  it('reports that profiling is Watt-only when runtime identity is unavailable', async () => {
    mocks.applicationId = undefined

    await expect(triggerManualProfile('cpu', 30)).resolves.toEqual({
      scheduled: false,
      reason: 'not-watt',
    })
    expect(mocks.send).not.toHaveBeenCalled()
  })

  it('reports an unavailable extension when Watt has no trigger handler', async () => {
    mocks.send.mockRejectedValue(
      Object.assign(new Error('handler missing'), { code: 'PLT_ITC_HANDLER_NOT_FOUND' })
    )

    await expect(triggerManualProfile('cpu', 30)).resolves.toEqual({
      scheduled: false,
      reason: 'unavailable',
    })
  })
})
