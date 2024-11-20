import { CronJobsListing } from 'components/interfaces/Integrations/CronJobs/CronJobsListing'
import ProjectIntegrationsLayout from 'components/layouts/ProjectIntegrationsLayout/ProjectIntegrationsLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { CronJob, useCronJobsQuery } from 'data/database-cron-jobs/database-cron-jobs-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useEffect, useState } from 'react'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'
import { CronJobsDisabledState } from '../../../../components/interfaces/Integrations/CronJobs/CronJobsDisabledState'

import { CreateCronJobSheet } from 'components/interfaces/Integrations/CronJobs/CreateCronJobSheet'
import { Sheet, SheetContent } from 'ui'

const CronJobsPage: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const [isClosingCreateCronJobSheet, setIsClosingCreateCronJobSheet] = useState(false)
  const [createCronJobSheetShown, setCreateCronJobSheetShown] = useState<
    Pick<CronJob, 'jobname' | 'schedule' | 'active' | 'command'> | undefined
  >()

  const { isError, refetch } = useCronJobsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data: extensions, isLoading: isLoadingExtensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const pgCronExtension = (extensions ?? []).find((ext) => ext.name === 'pg_cron')
  const pgCronExtensionInstalled = pgCronExtension?.installed_version

  useEffect(() => {
    // refetch the cron jobs after the pgcron extension has been installed
    if (pgCronExtensionInstalled && isError) {
      refetch()
    }
  }, [isError, pgCronExtensionInstalled, refetch])

  return (
    <ScaffoldContainer className="h-full">
      <ScaffoldSection className="h-full">
        <div className="col-span-12 h-full pb-8">
          {pgCronExtensionInstalled && (
            <FormHeader
              title="Cron jobs"
              description="Schedule and automate tasks like running queries or maintenance routines at specified intervals"
              actions={
                <>
                  <DocsButton href="https://supabase.com/docs/guides/database/extensions/pg_cron" />
                  <Button
                    type="primary"
                    onClick={() =>
                      setCreateCronJobSheetShown({
                        jobname: '',
                        schedule: '',
                        command: '',
                        active: true,
                      })
                    }
                  >
                    Create a new cron job
                  </Button>
                </>
              }
            />
          )}
          {isLoadingExtensions ? (
            <GenericSkeletonLoader />
          ) : !pgCronExtensionInstalled ? (
            <CronJobsDisabledState />
          ) : (
            <CronJobsListing />
          )}
        </div>
      </ScaffoldSection>

      <Sheet
        open={!!createCronJobSheetShown}
        onOpenChange={() => setIsClosingCreateCronJobSheet(true)}
      >
        <SheetContent size="default" tabIndex={undefined}>
          <CreateCronJobSheet
            selectedCronJob={createCronJobSheetShown}
            onClose={() => {
              setIsClosingCreateCronJobSheet(false)
              setCreateCronJobSheetShown(undefined)
            }}
            isClosing={isClosingCreateCronJobSheet}
            setIsClosing={setIsClosingCreateCronJobSheet}
          />
        </SheetContent>
      </Sheet>
    </ScaffoldContainer>
  )
}

CronJobsPage.getLayout = (page) => (
  <ProjectIntegrationsLayout title="Cron Jobs">{page}</ProjectIntegrationsLayout>
)

export default CronJobsPage
