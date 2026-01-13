import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { AlertCircle } from 'lucide-react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { useBackupsQuery } from 'data/database/backups-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import type { Timezone } from './PITR.types'
import { TimezoneSelection } from './TimezoneSelection'

interface PITRStatusProps {
  selectedTimezone: Timezone
  onUpdateTimezone: (timezone: Timezone) => void
  onSetConfiguration: () => void
}

const PITRStatus = ({
  selectedTimezone,
  onUpdateTimezone,
  onSetConfiguration,
}: PITRStatusProps) => {
  const { ref } = useParams()
  const { data: backups } = useBackupsQuery({ projectRef: ref })
  const { data: databases } = useReadReplicasQuery({ projectRef: ref })

  const hasReadReplicas = (databases ?? []).length > 1

  const { earliestPhysicalBackupDateUnix, latestPhysicalBackupDateUnix } =
    backups?.physicalBackupData ?? {}

  const earliestAvailableBackup = dayjs
    .unix(earliestPhysicalBackupDateUnix ?? 0)
    .tz(selectedTimezone?.utc[0])
    .format('DD MMM YYYY, HH:mm:ss')

  const latestAvailableBackup = dayjs
    .unix(latestPhysicalBackupDateUnix ?? 0)
    .tz(selectedTimezone?.utc[0])
    .format('DD MMM YYYY, HH:mm:ss')

  const { can: canTriggerPhysicalBackup } = useAsyncCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_job.walg.prepare_restore'
  )

  return (
    <>
      <FormPanel
        disabled={true}
        footer={
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <AlertCircle className="text-foreground-light" size={18} strokeWidth={1.5} />
              <span className="text-foreground-light text-sm">
                You'll be able to pick the right date and time when you begin
              </span>
            </div>
            <ButtonTooltip
              disabled={hasReadReplicas || !canTriggerPhysicalBackup}
              onClick={() => onSetConfiguration()}
              tooltip={{
                content: {
                  side: 'left',
                  text: hasReadReplicas
                    ? 'You will need to remove all read replicas first to trigger a PITR recovery'
                    : !canTriggerPhysicalBackup
                      ? 'You need additional permissions to trigger a PITR recovery'
                      : undefined,
                },
              }}
            >
              Start a restore
            </ButtonTooltip>
          </div>
        }
      >
        <div className="p-6 space-y-6">
          <div className="w-[350px]">
            <TimezoneSelection
              selectedTimezone={selectedTimezone}
              onSelectTimezone={onUpdateTimezone}
            />
          </div>
          <div className="flex items-center space-x-20">
            <div className="space-y-2">
              <p className="text-sm text-foreground-light">Database restore available from</p>
              <p className="text-2xl">{earliestAvailableBackup}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-foreground-light">Latest restore available at</p>
              <p className="text-2xl">{latestAvailableBackup}</p>
            </div>
          </div>
        </div>
      </FormPanel>
    </>
  )
}

export default PITRStatus
