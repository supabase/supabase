import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'

import { API_URL } from 'lib/constants'
import { useStore, withAuth } from 'hooks'
import { post } from 'lib/common/fetch'
import { PROJECT_STATUS } from 'lib/constants'
import { StorageLayout } from 'components/layouts'
import { StorageUsage } from 'components/to-be-cleaned/Storage'

/**
 * PageLayout is used to setup layout - as usual it will requires inject global store
 */
const PageLayout = () => {
  const router = useRouter()
  const { ref } = router.query

  const { ui } = useStore()
  const project = ui.selectedProject

  useEffect(() => {
    if (project && project.status === PROJECT_STATUS.INACTIVE) {
      post(`${API_URL}/projects/${ref}/restore`, {})
    }
  }, [project])

  if (!project) return <div></div>

  return (
    <StorageLayout title="Usage">
      <div className="storage-container flex flex-grow">
        <StorageUsage />
      </div>
    </StorageLayout>
  )
}

export default withAuth(observer(PageLayout))
