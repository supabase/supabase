import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'

import { API_URL } from 'lib/constants'
import { post } from 'lib/common/fetch'
import { PROJECT_STATUS } from 'lib/constants'
import { useStore, withAuth } from 'hooks'
import { StorageLayout } from 'components/layouts'
import { StoragePolicies } from 'components/to-be-cleaned/Storage'

const PageLayout = () => {
  const router = useRouter()
  const { ref } = router.query

  const { ui, meta } = useStore()
  const project = ui.selectedProject

  useEffect(() => {
    if (project && project.status === PROJECT_STATUS.INACTIVE) {
      post(`${API_URL}/projects/${ref}/restore`, {})
    }
    meta.roles.load()
  }, [project])

  if (!project) return <div></div>

  return (
    <StorageLayout title="Policies">
      <div className="storage-container flex flex-grow p-4">
        <StoragePolicies />
      </div>
    </StorageLayout>
  )
}

export default withAuth(observer(PageLayout))
