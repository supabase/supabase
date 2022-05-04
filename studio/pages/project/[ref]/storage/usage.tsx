import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'

import { API_URL } from 'lib/constants'
import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { PROJECT_STATUS } from 'lib/constants'
import { StorageLayout } from 'components/layouts'
import { StorageUsage } from 'components/to-be-cleaned/Storage'
import { NextPageWithLayout } from 'types'

/**
 * PageLayout is used to setup layout - as usual it will requires inject global store
 */
const PageLayout: NextPageWithLayout = () => {
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
    <div className="storage-container flex flex-grow">
      <StorageUsage />
    </div>
  )
}

PageLayout.getLayout = (page) => <StorageLayout title="Usage">{page}</StorageLayout>

export default observer(PageLayout)
