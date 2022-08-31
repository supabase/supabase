import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'

import { API_URL } from 'lib/constants'
import { post } from 'lib/common/fetch'
import { PROJECT_STATUS } from 'lib/constants'
import { useFlag, useStore } from 'hooks'
import { StorageLayout } from 'components/layouts'
import { StoragePolicies } from 'components/to-be-cleaned/Storage'
import { NextPageWithLayout } from 'types'

/**
 * PageLayout is used to setup layout - as usual it will requires inject global store
 */
const PageLayout: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query

  const { ui, meta } = useStore()
  const project = ui.selectedProject

  const kpsEnabled = useFlag('initWithKps')

  useEffect(() => {
    if (project && project.status === PROJECT_STATUS.INACTIVE) {
      post(`${API_URL}/projects/${ref}/restore`, { kps_enabled: kpsEnabled })
    }
    meta.roles.load()
  }, [project])

  if (!project) return <div></div>

  return (
    <div className="storage-container flex flex-grow p-4">
      <StoragePolicies />
    </div>
  )
}

PageLayout.getLayout = (page) => <StorageLayout title="Policies">{page}</StorageLayout>

export default observer(PageLayout)
