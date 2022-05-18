import React, { FC, useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { Typography, IconInfo } from '@supabase/ui'

import { useStore } from 'hooks'
import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import BackupItem from './BackupItem'
import Loading from 'components/ui/Loading'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import Panel from 'components/to-be-cleaned/Panel'

interface Props {}

const BackupsList: FC<Props> = ({}) => {
  const { ui, app } = useStore()
  const projectRef = ui.selectedProject?.ref || 'default'

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [projectData, setProjectData] = useState<any>([])

  useEffect(() => {
    retrieveBackups()
  }, [])

  const retrieveBackups = async () => {
    setIsLoading(true)
    const projectData = (await app.database.getBackups(projectRef)) as any
    setProjectData(projectData)
    setIsLoading(false)
  }

  if (isLoading) return <Loading />
  if (projectData.error) {
    return (
      <div>
        <Typography.Text type="secondary">Error loading backups</Typography.Text>
      </div>
    )
  }

  // Data Loaded
  const { backups, tierId } = projectData
  const sortedBackups = backups.sort((a: any, b: any) => b.id - a.id)

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
        <div className="block w-full rounded border border-green-500 border-opacity-50 bg-green-500 bg-opacity-5 p-3">
          <div className="flex space-x-3">
            <div>
              <IconInfo className="text-green-500" size="large" />
            </div>
            <p>No backups created yet. Check again tomorrow.</p>
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
