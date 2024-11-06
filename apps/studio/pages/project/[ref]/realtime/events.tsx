import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import { PublicationsList, PublicationsTables } from 'components/interfaces/Database'
import RealtimeLayout from 'components/layouts/RealtimeLayout/RealtimeLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'
import SinglePublicationView from 'components/interfaces/Database/Publications/SinglePublication'
import { Loading } from 'components/ui/Loading'

// [Joshen] Technically, best that we have these as separate URLs
// makes it easier to manage state, but foresee that this page might
// be consolidated somewhere else eventually for better UX

const DatabasePublications: NextPageWithLayout = () => {
  const { project } = useProjectContext()

  const { data, isLoading } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  },
  {
    select: (data) => data.find(pub => pub.name === 'supabase_realtime')
  })
  const realtimePublication = data ?? null

  console.log("publications:", realtimePublication);

  const canViewPublications = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'publications'
  )
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canViewPublications) {
    return <NoPermission isFullPage resourceText="view database publications" />
  }

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <div className="space-y-10">
            <div>
              <FormHeader title="Events" description='Which events would you like to broadcast' />
              <SinglePublicationView publicationName={"supabase_realtime"} />
            </div>
            <div>
              <FormHeader title="Tables" description='Which tables would you like to broadcast the events on' />
              <PublicationsTables
                selectedPublication={realtimePublication}
              />
            </div>
          </div>
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

DatabasePublications.getLayout = (page) => <RealtimeLayout title="Publications">{page}</RealtimeLayout>

export default DatabasePublications
