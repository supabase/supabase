import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'

import { StorageLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { StoragePolicies } from 'components/to-be-cleaned/Storage'
import { useStore } from 'hooks'
import { NextPageWithLayout } from 'types'

/**
 * PageLayout is used to setup layout - as usual it will requires inject global store
 */
const PageLayout: NextPageWithLayout = () => {
  const { ui, meta } = useStore()
  const { project } = useProjectContext()

  useEffect(() => {
    if (ui.selectedProjectRef) {
      meta.roles.load()
    }
  }, [ui.selectedProjectRef])

  if (!project) return <div></div>

  return (
    <div className="storage-container flex flex-grow p-4">
      <StoragePolicies />
    </div>
  )
}

PageLayout.getLayout = (page) => <StorageLayout title="Policies">{page}</StorageLayout>

export default observer(PageLayout)
