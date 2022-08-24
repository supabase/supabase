import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Tabs } from '@supabase/ui'

import { useStore } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { PITRBackupSelection } from 'components/interfaces/Database'
import { NextPageWithLayout } from 'types'

const DatabaseScheduledBackups: NextPageWithLayout = () => {
  const { ui } = useStore()
  const router = useRouter()

  const ref = ui.selectedProject?.ref ?? 'default'

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-5 pt-12 pb-20">
      <h3 className="text-scale-1200 text-xl">Backups</h3>

      <Tabs
        type="underlined"
        activeId="pitr"
        onChange={(id: any) => {
          if (id === 'scheduled') router.push(`/project/${ref}/database/backups/scheduled`)
        }}
      >
        <Tabs.Panel id="scheduled" label="Scheduled" />
        <Tabs.Panel id="pitr" label="Point in Time" />
      </Tabs>

      <div className="space-y-4">
        <p className="text-scale-1100 text-sm">
          Restore your project from a specific date and time.
        </p>
        <PITRBackupSelection />
      </div>
    </div>
  )
}

DatabaseScheduledBackups.getLayout = (page) => (
  <DatabaseLayout title="Database">{page}</DatabaseLayout>
)

export default observer(DatabaseScheduledBackups)
