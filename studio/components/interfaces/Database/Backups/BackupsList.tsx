import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { IconAlertCircle, IconClock } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import InformationBox from 'components/ui/InformationBox'
import Panel from 'components/ui/Panel'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useBackupsQuery } from 'data/database/backups-query'
import { useCheckPermissions } from 'hooks'
import BackupItem from './BackupItem'
import BackupsEmpty from './BackupsEmpty'

const BackupsList = () => {
  const { project: selectedProject } = useProjectContext()
  const projectRef = selectedProject?.ref || 'default'

  const { data: backups } = useBackupsQuery({ projectRef })

  const canTriggerScheduledBackups = useCheckPermissions(
    PermissionAction.INFRA_EXECUTE,
    'queue_job.restore.prepare'
  )

  const planKey = backups?.tierKey ?? ''
  const sortedBackups = (backups?.backups ?? []).sort(
    (a, b) => new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf()
  )
  const isPitrEnabled = backups?.pitr_enabled

  if (planKey === 'FREE') {
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

  if (isPitrEnabled) return null

  return (
    <div className="space-y-6">
      {sortedBackups.length === 0 && planKey !== 'FREE' ? (
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
