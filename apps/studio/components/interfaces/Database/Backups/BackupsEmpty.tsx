import { DatabaseBackup } from 'lucide-react'

import { EmptyState } from 'components/ui/EmptyState'

export const BackupsEmpty = () => {
  return (
    <EmptyState icon={DatabaseBackup} title="No backups yet" description="Check again tomorrow." />
  )
}
