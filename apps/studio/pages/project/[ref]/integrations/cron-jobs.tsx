import { CronJobsListing } from 'components/interfaces/Integrations/CronJobs/CronJobsListing'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'
import ProjectIntegrationsLayout from 'components/layouts/ProjectIntegrationsLayout/ProjectIntegrationsLayout'

const CronJobsPage: NextPageWithLayout = () => {
  // TODO: Change this to the correct permissions
  // const canReadFunctions = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'functions')
  // const isPermissionsLoaded = usePermissionsLoaded()

  // if (isPermissionsLoaded && !canReadFunctions) {
  //   return <NoPermission isFullPage resourceText="manage database cron jobs" />
  // }

  return (
    <ScaffoldContainer className="h-full">
      <ScaffoldSection className="h-full">
        <div className="col-span-12 h-full pb-8">
          <CronJobsListing />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

CronJobsPage.getLayout = (page) => (
  <ProjectIntegrationsLayout title="Database">{page}</ProjectIntegrationsLayout>
)

export default CronJobsPage
