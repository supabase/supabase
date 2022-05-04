import { useState } from 'react'
import { isUndefined } from 'lodash'
import { observer } from 'mobx-react-lite'

import { DatabaseLayout } from 'components/layouts'
import { PublicationsList, PublicationsTables } from 'components/interfaces/Database'
import { NextPageWithLayout } from 'types'

const DatabaseReplication: NextPageWithLayout = () => {
  const [selectedPublication, setSelectedPublication] = useState<any>()

  return (
    <div className="p-4">
      {isUndefined(selectedPublication) ? (
        <PublicationsList onSelectPublication={setSelectedPublication} />
      ) : (
        <PublicationsTables
          selectedPublication={selectedPublication}
          onSelectBack={() => setSelectedPublication(undefined)}
          onPublicationUpdated={setSelectedPublication}
        />
      )}
    </div>
  )
}

DatabaseReplication.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(DatabaseReplication)
