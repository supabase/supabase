import { FC } from 'react'
import { observer } from 'mobx-react-lite'

import { useStore } from 'hooks'
import Loading from 'components/ui/Loading'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import Panel from 'components/ui/Panel'

import BackupItem from './BackupItem'
import BackupsError from './BackupsError'
import BackupsEmpty from './BackupsEmpty'

interface Props {}

const BackupsList: FC<Props> = ({}) => {
  const { ui, backups } = useStore()
  const projectRef = ui.selectedProject?.ref || 'default'

  if (backups.isLoading) return <Loading />
  if (backups.error) return <BackupsError />

  const { tierKey } = backups.configuration
  const sortedBackups = backups.list()

  if (tierKey === 'FREE') {
    return (
      <UpgradeToPro
        primaryText="Free Plan does not include project backups."
        projectRef={projectRef}
        secondaryText="Please upgrade to Pro plan for up to 7 days of backups."
      />
    )
  }

  return (
    <div className="space-y-6">
      {!sortedBackups?.length && tierKey !== 'FREE' ? (
        <BackupsEmpty />
      ) : (
        <Panel>
          {sortedBackups?.map((x: any, i: number) => {
            return <BackupItem key={x.id} projectRef={projectRef} backup={x} index={i} />
          })}
        </Panel>
      )}
    </div>
  )
}

export default observer(BackupsList)
