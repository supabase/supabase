import Link from 'next/link'
import React, { FC, useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Typography, IconClock, IconInfo } from '@supabase/ui'

import { useStore } from 'hooks'
import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import BackupItem from './BackupItem'
import Loading from 'components/ui/Loading'
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

  return (
    <div className="space-y-6">
      {/* <div className="mb-4">
        <BackupButton backups={sortedBackups} projectRef={projectRef} />
      </div> */}

      {tierId === STRIPE_PRODUCT_IDS.FREE && (
        <div
          className={[
            'block w-full p-3 px-6 border rounded border-opacity-20',
            'bg-gray-100 border-gray-600',
            'dark:bg-gray-600 dark:border-gray-500',
          ].join(' ')}
        >
          <div className="flex space-x-3">
            <div className="mt-1">
              <IconClock size="large" />
            </div>
            <div className="flex justify-between w-full items-center">
              <div>
                <Typography.Text>Free Plan does not include project backups.</Typography.Text>
                <div>
                  <Typography.Text type="secondary">
                    Please upgrade to Pro plan for up to 7 days of backups.
                  </Typography.Text>
                </div>
              </div>
              <Link href={`/project/${projectRef}/settings/billing`}>
                <Button type="primary" className="flex-grow">
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {!sortedBackups.length && tierId !== STRIPE_PRODUCT_IDS.FREE ? (
        <div className="block w-full bg-green-500 bg-opacity-5 p-3 border border-green-500 border-opacity-50 rounded">
          <div className="flex space-x-3">
            <div>
              <IconInfo className="text-green-500" size="large" />
            </div>
            <Typography.Text type="success">
              No backups created yet. Check again tomorrow.
            </Typography.Text>
          </div>
        </div>
      ) : (
        <Panel
        // title={[<Typography.Title level={5}>Date</Typography.Title>]}
        >
          {!sortedBackups && (
            <div className="text-center p-4">
              <img className="loading-spinner" src="/img/spinner.gif"></img>
            </div>
          )}
          {sortedBackups &&
            sortedBackups.map((x: any, i: number) => {
              return <BackupItem key={x.id} projectRef={projectRef} backup={x} index={i} />
            })}
        </Panel>
      )}
    </div>
  )
}

export default observer(BackupsList)
