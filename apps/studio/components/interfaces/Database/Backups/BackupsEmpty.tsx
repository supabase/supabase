import { DatabaseBackupIcon } from 'lucide-react'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

export const BackupsEmpty = () => {
  return (
    <EmptyStatePresentational
      icon={DatabaseBackupIcon}
      title="No backups yet"
      description="Check again tomorrow."
    />
  )
}
