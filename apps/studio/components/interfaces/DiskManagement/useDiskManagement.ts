import { atom, useAtom } from 'jotai'
import { DiskStorageSchemaType } from './DiskManagementPanelSchema'

interface ExtendedDiskStorageSchemaType extends DiskStorageSchemaType {
  totalSize: number
  mainDiskUsed: number
  replicaDiskUsed: number
}

const diskConfigAtom = atom<ExtendedDiskStorageSchemaType>({
  storageType: 'gp3',
  totalSize: 8,
  provisionedIOPS: 3000,
  throughput: 125,
  mainDiskUsed: 4,
  replicaDiskUsed: 4,
})

export function useDiskManagement() {
  const [diskConfig, setDiskConfig] = useAtom(diskConfigAtom)

  const updateDiskConfiguration = (newConfig: Partial<DiskStorageSchemaType>) => {
    setDiskConfig((prev) => ({ ...prev, ...newConfig }))
  }
  return {
    ...diskConfig,
    updateDiskConfiguration,
  }
}

export type { DiskStorageSchemaType }
