import { FC } from 'react'
import { observer } from 'mobx-react-lite'
import { IconInfo } from '@supabase/ui'

import { useStore } from 'hooks'
import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import BackupItem from './BackupItem'
import Loading from 'components/ui/Loading'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import Panel from 'components/to-be-cleaned/Panel'

interface Props {}

const BackupsList: FC<Props> = ({}) => {
  const { ui, backups } = useStore()
  const projectRef = ui.selectedProject?.ref || 'default'

  if (backups.isLoading) return <Loading />

  const { tierId } = backups.configuration
  const sortedBackups = backups.list()

  if (tierId === STRIPE_PRODUCT_IDS.FREE) {
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
      {!sortedBackups?.length && tierId !== STRIPE_PRODUCT_IDS.FREE ? (
        <div className="block w-full rounded border border-gray-400 border-opacity-50 bg-gray-300 p-3">
          <div className="flex space-x-3">
            <IconInfo size={20} strokeWidth={1.5} />
            <p className="text-sm">No backups created yet. Check again tomorrow.</p>
          </div>
        </div>
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
