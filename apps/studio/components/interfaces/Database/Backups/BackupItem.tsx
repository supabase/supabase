import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Download } from 'lucide-react'
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { CoverageChips } from './RestorePoints/CoverageChips'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { InlineLink } from '@/components/ui/InlineLink'
import { useBackupDownloadMutation } from '@/data/database/backup-download-mutation'
import type { DatabaseBackup } from '@/data/database/backups-query'
import type { RestorePointCoverage } from '@/data/restore-points/restore-points-mocks'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

interface BackupItemProps {
  index: number
  isHealthy: boolean
  backup: DatabaseBackup
  /** Platform coverage for this restore point (Database / Storage / Config). */
  coverage?: RestorePointCoverage
  onSelectBackup: () => void
}

export const BackupItem = ({
  index,
  isHealthy,
  backup,
  coverage,
  onSelectBackup,
}: BackupItemProps) => {
  const { ref: projectRef } = useParams()
  const { can: canTriggerScheduledBackups } = useAsyncCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_job.restore.prepare'
  )

  const { mutate: downloadBackup, isPending: isDownloading } = useBackupDownloadMutation({
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
    if (backup.status === 'COMPLETED')
      return (
        <div className="flex space-x-4">
          <ButtonTooltip
            variant="default"
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
              variant="default"
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
      className={`flex min-h-12 items-center justify-between gap-x-4 px-6 py-2 ${
        index ? 'border-t border-default' : ''
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <TimestampInfo
          displayAs="utc"
          utcTimestamp={backup.inserted_at}
          labelFormat="DD MMM YYYY HH:mm:ss (ZZ)"
          className="text-left text-sm! font-mono tracking-tight"
        />
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="default">{backup.isPhysicalBackup ? 'Physical' : 'Logical'}</Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {backup.isPhysicalBackup
              ? 'File-level backups of your entire database.'
              : 'SQL-based backups of your entire database.'}{' '}
            <InlineLink href="https://supabase.com/blog/postgresql-physical-logical-backups">
              Learn more
            </InlineLink>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Coverage sits in its own column between the timestamp and the actions */}
      <div className="flex flex-1 justify-center">
        {coverage && <CoverageChips primitives={coverage.primitives} />}
      </div>

      <div>{generateSideButtons(backup)}</div>
    </div>
  )
}
