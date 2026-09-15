import { DatabaseBackup } from 'lucide-react'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

export const BackupsEmpty = () => {
  return (
    <EmptyStatePresentational
      icon={DatabaseBackup}
      title="No backups yet"
      description="Check again tomorrow."
    />
  )
}
