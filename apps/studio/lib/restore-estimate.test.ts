import { describe, expect, it } from 'vitest'

import {
  estimateRestoreTimeFromSizeGb,
  getRestoreLongRunningThresholdMinutes,
} from './restore-estimate'

describe('restore-estimate', () => {
  it('keeps the existing restore interpolation', () => {
    expect(estimateRestoreTimeFromSizeGb(0)).toBe(3)
    expect(estimateRestoreTimeFromSizeGb(21_000)).toBeCloseTo(723, 0)
  })

  it('uses a 10 minute floor when size is missing or small', () => {
    expect(getRestoreLongRunningThresholdMinutes()).toBe(10)
    expect(getRestoreLongRunningThresholdMinutes(null)).toBe(10)
    expect(getRestoreLongRunningThresholdMinutes(100)).toBe(10)
  })

  it('scales the long-running threshold for larger restores', () => {
    expect(getRestoreLongRunningThresholdMinutes(200)).toBe(15)
    expect(getRestoreLongRunningThresholdMinutes(500)).toBe(31)
    expect(getRestoreLongRunningThresholdMinutes(1_000)).toBe(56)
  })
})
