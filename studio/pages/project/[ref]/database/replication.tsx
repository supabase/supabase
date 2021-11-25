import { NextPage } from 'next'
import { useState } from 'react'
import { isUndefined } from 'lodash'
import { observer } from 'mobx-react-lite'

import { withAuth } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { PublicationsList, PublicationsTables } from 'components/interfaces/Database'

const DatabaseReplication: NextPage = () => {
  const [selectedPublication, setSelectedPublication] = useState<any>()
  return (
    <DatabaseLayout title="Database">
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
    </DatabaseLayout>
  )
}

export default withAuth(observer(DatabaseReplication))
