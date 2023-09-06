import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { Badge, Button } from 'ui'

import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import { useBackupRestoreMutation } from 'data/database/backup-restore-mutation'
import { setProjectStatus } from 'data/projects/projects-query'
import { useCheckPermissions, useStore } from 'hooks'
import { PROJECT_STATUS } from 'lib/constants'

interface BackupItemProps {
  projectRef: string
  backup: any
  index: number
}

const BackupItem = ({ projectRef, backup, index }: BackupItemProps) => {
  const router = useRouter()
  const { ui } = useStore()
  const queryClient = useQueryClient()

  const canTriggerScheduledBackups = useCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_job.restore.prepare'
  )

  const { mutate: restoreFromBackup, isLoading: isRestoring } = useBackupRestoreMutation({
    onSuccess: () => {
      setTimeout(() => {
        setProjectStatus(queryClient, projectRef, PROJECT_STATUS.RESTORING)
        ui.setNotification({
          category: 'success',
          message: `Restoring database back to ${dayjs(backup.inserted_at).format(
            'DD MMM YYYY HH:mm:ss'
          )}`,
        })
        router.push(`/project/${projectRef}`)
      }, 3000)
    },
  })

  const onRestoreClick = () => {
    confirmAlert({
      title: 'Confirm to restore',
      message: `Are you sure you want to restore from ${dayjs(backup.inserted_at).format(
        'DD MMM YYYY'
      )}? This will destroy any new data written since this backup was made.`,
      onAsyncConfirm: async () => restoreFromBackup({ ref: projectRef, backup }),
    })
  }

  const generateSideButtons = (backup: any) => {
    if (backup.status === 'COMPLETED')
      return (
        <div className="flex space-x-4">
          <Button
            type="default"
            disabled={!canTriggerScheduledBackups || isRestoring}
            onClick={onRestoreClick}
          >
            Restore
          </Button>
        </div>
      )
    return <Badge color="yellow">Backup In Progress...</Badge>
  }

  return (
    <div
      className={`flex h-12 items-center justify-between px-6 ${
        index ? 'border-t dark:border-dark' : ''
      }`}
    >
      <p className="text-sm text-scale-1200 ">
        {dayjs(backup.inserted_at).format('DD MMM YYYY HH:mm:ss')}
      </p>
      <div className="">{generateSideButtons(backup)}</div>
    </div>
  )
}

export default BackupItem
