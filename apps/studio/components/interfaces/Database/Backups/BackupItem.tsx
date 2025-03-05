import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Download } from 'lucide-react'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useBackupDownloadMutation } from 'data/database/backup-download-mutation'
import type { DatabaseBackup } from 'data/database/backups-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Badge } from 'ui'
import { TimestampInfo } from 'ui-patterns'

interface BackupItemProps {
  index: number
  isHealthy: boolean
  backup: DatabaseBackup
  onSelectBackup: () => void
}

const BackupItem = ({ index, isHealthy, backup, onSelectBackup }: BackupItemProps) => {
  const { ref: projectRef } = useParams()
  const canTriggerScheduledBackups = useCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_job.restore.prepare'
  )

  const { mutate: downloadBackup, isLoading: isDownloading } = useBackupDownloadMutation({
    onSuccess: (res) => {
      const { fileUrl } = res

      // Trigger browser download by create,trigger and remove tempLink
      const tempLink = document.createElement('a')
      tempLink.href = fileUrl
      document.body.appendChild(tempLink)
      tempLink.click()
      document.body.removeChild(tempLink)
    },
  })

  const generateSideButtons = (backup: DatabaseBackup) => {
    // [Joshen] API typing is incorrect here, status is getting typed as Record<string, never>
    if ((backup as any).status === 'COMPLETED')
      return (
        <div className="flex space-x-4">
          <ButtonTooltip
            type="default"
            disabled={!isHealthy || !canTriggerScheduledBackups}
            onClick={onSelectBackup}
            tooltip={{
              content: {
                side: 'bottom',
                text: !isHealthy
                  ? 'Cannot be restored as project is not active'
                  : !canTriggerScheduledBackups
                    ? 'You need additional permissions to trigger a restore'
                    : undefined,
              },
            }}
          >
            Restore
          </ButtonTooltip>
          {!backup.isPhysicalBackup && (
            <ButtonTooltip
              type="default"
              icon={<Download />}
              loading={isDownloading}
              disabled={!canTriggerScheduledBackups || isDownloading}
              onClick={() => {
                if (!projectRef) return console.error('Project ref is required')
                downloadBackup({ ref: projectRef, backup })
              }}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canTriggerScheduledBackups
                    ? 'You need additional permissions to download backups'
                    : undefined,
                },
              }}
            >
              Download
            </ButtonTooltip>
          )}
        </div>
      )
    return <Badge variant="warning">Backup In Progress...</Badge>
  }

  return (
    <div
      className={`flex h-12 items-center justify-between px-6 ${
        index ? 'border-t border-default' : ''
      }`}
    >
      <TimestampInfo
        displayAs="utc"
        utcTimestamp={backup.inserted_at}
        labelFormat="DD MMM YYYY HH:mm:ss (ZZ)"
        className="text-left !text-sm font-mono tracking-tight"
      />
      <div>{generateSideButtons(backup)}</div>
    </div>
  )
}

export default BackupItem
