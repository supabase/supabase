import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useCheckPermissions, useStore } from 'hooks'
import { NextPageWithLayout } from 'types'
import { DatabaseLayout } from 'components/layouts'
import { PublicationsList, PublicationsTables } from 'components/interfaces/Database'
import NoPermission from 'components/ui/NoPermission'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'

// [Joshen] Technically, best that we have these as separate URLs
// makes it easier to manage state, but foresee that this page might
// be consolidated somewhere else eventually for better UX

const DatabaseReplication: NextPageWithLayout = () => {
  const { meta } = useStore()
  const publications = meta.publications.list()

  const canViewPublications = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'publications'
  )

  const [selectedPublicationId, setSelectedPublicationId] = useState<number>()
  const selectedPublication = publications.find((pub) => pub.id === selectedPublicationId)

  if (!canViewPublications) {
    return <NoPermission isFullPage resourceText="view database publications" />
  }

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <div className="mb-4">
            <h3 className="mb-1 text-xl text-foreground">Database Replications</h3>
          </div>
          {selectedPublicationId === undefined ? (
            <PublicationsList onSelectPublication={setSelectedPublicationId} />
          ) : (
            <PublicationsTables
              selectedPublication={selectedPublication}
              onSelectBack={() => setSelectedPublicationId(undefined)}
            />
          )}
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

DatabaseReplication.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(DatabaseReplication)
