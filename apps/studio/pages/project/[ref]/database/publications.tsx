import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import { PublicationsList, PublicationsTables } from 'components/interfaces/Database'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

// [Joshen] Technically, best that we have these as separate URLs
// makes it easier to manage state, but foresee that this page might
// be consolidated somewhere else eventually for better UX

const DatabasePublications: NextPageWithLayout = () => {
  const { project } = useProjectContext()

  const { data } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const publications = data ?? []

  const canViewPublications = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'publications'
  )
  const isPermissionsLoaded = usePermissionsLoaded()

  const [selectedPublicationId, setSelectedPublicationId] = useState<number>()
  const selectedPublication = publications.find((pub) => pub.id === selectedPublicationId)

  if (isPermissionsLoaded && !canViewPublications) {
    return <NoPermission isFullPage resourceText="view database publications" />
  }

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <FormHeader title="Database Publications" />
          {selectedPublication === undefined ? (
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

DatabasePublications.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default DatabasePublications
