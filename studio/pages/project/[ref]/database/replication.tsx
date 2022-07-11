import { useState } from 'react'
import { observer } from 'mobx-react-lite'

import { useStore } from 'hooks'
import { NextPageWithLayout } from 'types'
import { DatabaseLayout } from 'components/layouts'
import { PublicationsList, PublicationsTables } from 'components/interfaces/Database'

// [Joshen] Technically, best that we have these as separate URLs
// makes it easier to manage state, but foresee that this page might
// be consolidated somewhere else eventually for better UX

const DatabaseReplication: NextPageWithLayout = () => {
  const { meta } = useStore()
  const publications = meta.publications.list()

  const [selectedPublicationId, setSelectedPublicationId] = useState<number>()
  const selectedPublication = publications.find((pub) => pub.id === selectedPublicationId)

  return (
    <div className="p-4">
      {selectedPublicationId === undefined ? (
        <PublicationsList onSelectPublication={setSelectedPublicationId} />
      ) : (
        <PublicationsTables
          selectedPublication={selectedPublication}
          onSelectBack={() => setSelectedPublicationId(undefined)}
        />
      )}
    </div>
  )
}

DatabaseReplication.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(DatabaseReplication)
