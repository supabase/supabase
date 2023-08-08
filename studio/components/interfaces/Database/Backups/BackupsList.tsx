import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import InformationBox from 'components/ui/InformationBox'
import Loading from 'components/ui/Loading'
import Panel from 'components/ui/Panel'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useCheckPermissions, useStore } from 'hooks'
import { IconAlertCircle, IconClock } from 'ui'
import BackupItem from './BackupItem'
import BackupsEmpty from './BackupsEmpty'
import BackupsError from './BackupsError'

const BackupsList = () => {
  const { project: selectedProject } = useProjectContext()
  const { backups } = useStore()
  const projectRef = selectedProject?.ref || 'default'
  const canTriggerScheduledBackups = useCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_job.restore.prepare'
  )

  const isPitrEnabled = backups?.configuration?.walg_enabled

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
        secondaryText="Upgrade to the Pro plan for up to 7 days of scheduled backups."
        addon="pitr"
      />
    )
  }

  if (isPitrEnabled) {
    return <></>
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
