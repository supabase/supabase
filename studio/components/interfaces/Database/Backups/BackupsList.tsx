import { FC } from 'react'
import { observer } from 'mobx-react-lite'

import { useStore, checkPermissions } from 'hooks'
import Loading from 'components/ui/Loading'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import Panel from 'components/ui/Panel'

import BackupItem from './BackupItem'
import BackupsError from './BackupsError'
import BackupsEmpty from './BackupsEmpty'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import InformationBox from 'components/ui/InformationBox'
import { IconAlertCircle, IconClock } from 'ui'

interface Props {}

const BackupsList: FC<Props> = ({}) => {
  const { ui, backups } = useStore()
  const projectRef = ui.selectedProject?.ref || 'default'
  const canTriggerScheduledBackups = checkPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_job.restore.prepare'
  )

  if (backups.isLoading) return <Loading />
  if (backups.error) return <BackupsError />

  const { tierKey } = backups.configuration
  const sortedBackups = backups.list()

  if (tierKey === 'FREE') {
    return (
      <UpgradeToPro
        icon={<IconClock size="large" />}
        primaryText="Free Plan does not include project backups."
        projectRef={projectRef}
        secondaryText="Please upgrade to the Pro plan for up to 7 days of scheduled backups."
      />
    )
  }

  return (
    <div className="space-y-6">
      {!sortedBackups?.length && tierKey !== 'FREE' ? (
        <BackupsEmpty />
      ) : (
        <>
          {!canTriggerScheduledBackups && (
            <InformationBox
              icon={<IconAlertCircle className="text-scale-1100" strokeWidth={2} />}
              title="You need additional permissions to trigger a scheduled backup"
            />
          )}
          <Panel>
            {sortedBackups?.map((x: any, i: number) => {
              return <BackupItem key={x.id} projectRef={projectRef} backup={x} index={i} />
            })}
          </Panel>
        </>
      )}
    </div>
  )
}

export default observer(BackupsList)
