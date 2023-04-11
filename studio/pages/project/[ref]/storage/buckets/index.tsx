import React, { useEffect } from 'react'
import { observer } from 'mobx-react-lite'

import { API_URL } from 'lib/constants'
import { useFlag, useStore } from 'hooks'
import { useParams } from 'common/hooks'
import { post } from 'lib/common/fetch'
import { PROJECT_STATUS } from 'lib/constants'
import { StorageLayout } from 'components/layouts'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { NextPageWithLayout } from 'types'

/**
 * PageLayout is used to setup layout - as usual it will requires inject global store
 */
const PageLayout: NextPageWithLayout = ({}) => {
  const { ref } = useParams()
  const { ui } = useStore()
  const project = ui.selectedProject
  const kpsEnabled = useFlag('initWithKps')

  useEffect(() => {
    if (project && project.status === PROJECT_STATUS.INACTIVE) {
      post(`${API_URL}/projects/${ref}/restore`, { kps_enabled: kpsEnabled })
    }
  }, [project])

  if (!project) return <div></div>

  return (
    <div className="storage-container flex flex-grow">
      <ProductEmptyState
        title="Storage"
        infoButtonLabel="About storage"
        infoButtonUrl="https://supabase.com/docs/guides/storage"
      >
        <p className="text-scale-1100 text-sm">
          Create buckets to store and serve any type of digital content.
        </p>
        <p className="text-scale-1100 text-sm">
          Make your buckets private or public depending on your security preference.
        </p>
      </ProductEmptyState>
    </div>
  )
}

PageLayout.getLayout = (page) => <StorageLayout title="Buckets">{page}</StorageLayout>

export default observer(PageLayout)
