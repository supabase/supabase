import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { AlertCircle } from 'lucide-react'

import { FormPanel } from 'components/ui/Forms/FormPanel'
import { useBackupsQuery } from 'data/database/backups-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Button } from 'ui'
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

  const canTriggerPhysicalBackup = useCheckPermissions(
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
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger asChild>
                <Button
                  disabled={hasReadReplicas || !canTriggerPhysicalBackup}
                  onClick={() => onSetConfiguration()}
                >
                  Start a restore
                </Button>
              </Tooltip.Trigger>
              {hasReadReplicas ||
                (!canTriggerPhysicalBackup && (
                  <Tooltip.Portal>
                    <Tooltip.Content side="left">
                      <Tooltip.Arrow className="radix-tooltip-arrow" />
                      <div
                        className={[
                          'rounded bg-alternative py-1 px-2 leading-none shadow',
                          'border border-background',
                        ].join(' ')}
                      >
                        <span className="text-xs text-foreground">
                          {hasReadReplicas
                            ? 'You will need to remove all read replicas first to trigger a PITR recovery'
                            : !canTriggerPhysicalBackup
                              ? 'You need additional permissions to trigger a PITR recovery'
                              : null}
                        </span>
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                ))}
            </Tooltip.Root>
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
