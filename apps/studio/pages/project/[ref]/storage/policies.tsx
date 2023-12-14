import { StorageLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { StoragePolicies } from 'components/to-be-cleaned/Storage'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  if (!project) return <div></div>

  return (
    <div className="storage-container flex flex-grow p-4">
      <StoragePolicies />
    </div>
  )
}

PageLayout.getLayout = (page) => <StorageLayout title="Policies">{page}</StorageLayout>

export default PageLayout
