import { atom, useAtom } from 'jotai'
import { DiskStorageSchemaType } from './DiskManagementPanelSchema'
import { components } from 'api-types'

interface ExtendedDiskStorageSchemaType extends DiskStorageSchemaType {
  totalSize: number
  mainDiskUsed: number
  replicaDiskUsed: number
  plan: 'tier_free' | 'tier_pro' | 'tier_team' | 'tier_enterprise'
  compute: components['schemas']['AddonVariantId']
  hasReadReplica: boolean
  remainingTime: number
  totalWaitTime: number
  // regions used in read replicas
  readReplicas: string[]
}

const diskConfigAtom = atom<ExtendedDiskStorageSchemaType>({
  storageType: 'gp3',
  totalSize: 8,
  provisionedIOPS: 3000,
  throughput: 125,
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
  return {
    ...diskConfig,
    updateDiskConfiguration,
  }
}

export type { DiskStorageSchemaType }
