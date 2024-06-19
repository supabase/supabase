import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { Download } from 'lucide-react'

import { useBackupDownloadMutation } from 'data/database/backup-download-mutation'
import type { DatabaseBackup } from 'data/database/backups-query'
import { useCheckPermissions } from 'hooks'
import { Badge, Button, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_, Tooltip_Shadcn_ } from 'ui'

interface BackupItemProps {
  index: number
  isHealthy: boolean
  projectRef: string
  backup: DatabaseBackup
  onSelectBackup: () => void
}

const BackupItem = ({ index, isHealthy, backup, projectRef, onSelectBackup }: BackupItemProps) => {
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

  const generateSideButtons = (backup: any) => {
    if (backup.status === 'COMPLETED')
      return (
        <div className="flex space-x-4">
          <Tooltip_Shadcn_>
            <TooltipTrigger_Shadcn_ asChild>
              <Button
                type="default"
                className="pointer-events-auto"
                disabled={!isHealthy || !canTriggerScheduledBackups}
                onClick={onSelectBackup}
              >
                Restore
              </Button>
            </TooltipTrigger_Shadcn_>
            {(!isHealthy || !canTriggerScheduledBackups) && (
              <TooltipContent_Shadcn_ side="bottom">
                {!isHealthy
                  ? 'Cannot be restored as project is not active'
                  : !canTriggerScheduledBackups
                    ? 'You need additional permissions to trigger a restore'
                    : ''}
              </TooltipContent_Shadcn_>
            )}
          </Tooltip_Shadcn_>
          {!backup.isPhysicalBackup && (
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <Button
                  type="default"
                  className="pointer-events-auto"
                  icon={<Download />}
                  loading={isDownloading}
                  disabled={!canTriggerScheduledBackups || isDownloading}
                  onClick={() => downloadBackup({ ref: projectRef, backup })}
                >
                  Download
                </Button>
              </TooltipTrigger_Shadcn_>
              {!canTriggerScheduledBackups && (
                <TooltipContent_Shadcn_ side="bottom">
                  You need additional permissions to download backups
                </TooltipContent_Shadcn_>
              )}
            </Tooltip_Shadcn_>
          )}
        </div>
      )
    return <Badge variant="warning">Backup In Progress...</Badge>
  }

  const generateBackupName = (backup: any) => {
    if (backup.status == 'COMPLETED') {
      return `${dayjs(backup.inserted_at).format('DD MMM YYYY HH:mm:ss')} UTC`
    }
    return dayjs(backup.inserted_at).format('DD MMM YYYY')
  }

  return (
    <div
      className={`flex h-12 items-center justify-between px-6 ${
        index ? 'border-t border-default' : ''
      }`}
    >
      <p className="text-sm text-foreground ">{generateBackupName(backup)}</p>
      <div>{generateSideButtons(backup)}</div>
    </div>
  )
}

export default BackupItem
