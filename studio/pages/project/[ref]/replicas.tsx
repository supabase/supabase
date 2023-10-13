import Map from 'components/interfaces/ReadReplicas/Map'
import { DatabaseLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'

const ReadReplicasPage: NextPageWithLayout = () => {
  // [Joshen] Temp for me to test some UI components
  return (
    <>
      <Map />
    </>
  )
}

ReadReplicasPage.getLayout = (page) => (
  <DatabaseLayout>
    <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
      {page}
    </main>
  </DatabaseLayout>
)

export default ReadReplicasPage
