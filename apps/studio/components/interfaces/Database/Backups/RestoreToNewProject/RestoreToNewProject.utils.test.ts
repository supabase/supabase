import { describe, expect, it } from 'vitest'

import { projectSpecToMonthlyPrice } from './RestoreToNewProject.utils'
import { InfraInstanceSize } from '@/components/interfaces/DiskManagement/DiskManagement.types'
import { DiskType } from '@/components/interfaces/DiskManagement/ui/DiskManagement.constants'
import { PlanId } from '@/data/subscriptions/types'

const getComputePrice = (targetComputeSize: InfraInstanceSize, planId: PlanId) =>
  projectSpecToMonthlyPrice({
    targetVolumeSizeGb: 8,
    targetComputeSize,
    planId,
    storageType: DiskType.GP3,
  }).computePrice

describe('projectSpecToMonthlyPrice', () => {
  it('prices nano at the micro rate on paid plans', () => {
    expect(getComputePrice('nano', 'pro')).toBe(9.68)
    expect(getComputePrice('nano', 'team')).toBe(9.68)
  })

  it('prices pico at the micro rate on paid plans', () => {
    expect(getComputePrice('pico', 'pro')).toBe(9.68)
  })

  it('prices nano and pico at zero on the free plan', () => {
    expect(getComputePrice('nano', 'free')).toBe(0)
    expect(getComputePrice('pico', 'free')).toBe(0)
  })

  it('prices sizes above nano from their own compute rate', () => {
    expect(getComputePrice('micro', 'pro')).toBe(9.68)
    expect(getComputePrice('small', 'pro')).toBe(14.83)
  })
})
