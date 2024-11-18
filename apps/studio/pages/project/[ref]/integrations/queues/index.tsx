import { QueuesListing } from 'components/interfaces/Integrations/Queues/QueuesListing'
import ProjectIntegrationsLayout from 'components/layouts/ProjectIntegrationsLayout/ProjectIntegrationsLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const QueuesPage: NextPageWithLayout = () => {
  // TODO: Change this to the correct permissions
  // const canReadFunctions = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'functions')
  // const isPermissionsLoaded = usePermissionsLoaded()

  // if (isPermissionsLoaded && !canReadFunctions) {
  //   return <NoPermission isFullPage resourceText="manage database queues" />
  // }

  return (
    <ScaffoldContainer className="h-full">
      <ScaffoldSection className="h-full">
        <div className="col-span-12 h-full pb-8">
          <QueuesListing />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

QueuesPage.getLayout = (page) => (
  <ProjectIntegrationsLayout title="Queues">{page}</ProjectIntegrationsLayout>
)

export default QueuesPage
