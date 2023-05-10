import React, { useEffect } from 'react'
import { observer } from 'mobx-react-lite'

import { API_URL, PROJECT_STATUS } from 'lib/constants'
import { useFlag, useStore } from 'hooks'
import { useParams } from 'common/hooks'
import { post } from 'lib/common/fetch'
import { SettingsLayout } from 'components/layouts'
import { StorageSettings } from 'components/to-be-cleaned/Storage'
import { NextPageWithLayout } from 'types'

/**
 * PageLayout is used to setup layout - as usual it will requires inject global store
 */
const PageLayout: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()

  const { ui } = useStore()
  const project = ui.selectedProject

  const kpsEnabled = useFlag('initWithKps')

  useEffect(() => {
    if (project && project.status === PROJECT_STATUS.INACTIVE) {
      post(`${API_URL}/projects/${projectRef}/restore`, { kps_enabled: kpsEnabled })
    }
  }, [project])

  if (!project) return <div></div>

  return (
    <div className="flex flex-grow p-4 storage-container">
      <StorageSettings projectRef={projectRef} />
    </div>
  )
}

PageLayout.getLayout = (page) => <SettingsLayout title="Settings">{page}</SettingsLayout>

export default observer(PageLayout)
