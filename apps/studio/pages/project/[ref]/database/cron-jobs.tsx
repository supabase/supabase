import { CronJobsListing } from 'components/interfaces/Database/CronJobs/CronJobsListing'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const CronJobsPage: NextPageWithLayout = () => {
  // TODO: Change this to the correct permissions
  // const canReadFunctions = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'functions')
  // const isPermissionsLoaded = usePermissionsLoaded()

  // if (isPermissionsLoaded && !canReadFunctions) {
  //   return <NoPermission isFullPage resourceText="manage database cron jobs" />
  // }

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <CronJobsListing />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
    </>
  )
}

CronJobsPage.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default CronJobsPage
