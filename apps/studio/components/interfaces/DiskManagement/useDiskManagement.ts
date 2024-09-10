import { atom, useAtom } from 'jotai'
import { DiskStorageSchemaType } from './DiskManagementPanelSchema'
import { components } from 'api-types'

type PlanType = 'tier_free' | 'tier_pro' | 'tier_team' | 'tier_enterprise'

interface PlanDetails {
  includedDiskGB: number
  includedDiskPricePerMonth: number
}

const PLAN_DETAILS: Record<PlanType, PlanDetails> = {
  tier_free: { includedDiskGB: 1, includedDiskPricePerMonth: 0 },
  tier_pro: { includedDiskGB: 8, includedDiskPricePerMonth: 5 },
  tier_team: { includedDiskGB: 16, includedDiskPricePerMonth: 10 },
  tier_enterprise: { includedDiskGB: 32, includedDiskPricePerMonth: 20 },
}

interface ExtendedDiskStorageSchemaType {
  type: 'gp3' | 'io2'
  size_gb: number
  iops: number
  throughput_mbps: number

  mainDiskUsed: number
  replicaDiskUsed: number
  plan: PlanType
  compute: components['schemas']['AddonVariantId']
  hasReadReplica: boolean
  remainingTime: number
  totalWaitTime: number
  readReplicas: string[]
}

const diskConfigAtom = atom<ExtendedDiskStorageSchemaType>({
  type: 'gp3',
  size_gb: 8,
  iops: 3000,
  throughput_mbps: 125,

  mainDiskUsed: 4,
  replicaDiskUsed: 4,
  plan: 'tier_pro',
  compute: 'ci_micro',
  hasReadReplica: false,
  remainingTime: 0,
  totalWaitTime: 180,
  readReplicas: ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2'],
})

export function useDiskManagement() {
  const [diskConfig, setDiskConfig] = useAtom(diskConfigAtom)

  const updateDiskConfiguration = (newConfig: Partial<ExtendedDiskStorageSchemaType>) => {
    setDiskConfig((prev) => ({ ...prev, ...newConfig }))
  }

  const getPlanDetails = () => PLAN_DETAILS[diskConfig.plan]

  return {
    ...diskConfig,
    updateDiskConfiguration,
    getPlanDetails,
  }
}

export type { DiskStorageSchemaType, PlanType, PlanDetails }
export { PLAN_DETAILS }
