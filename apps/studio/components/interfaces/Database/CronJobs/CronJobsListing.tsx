import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import AlertError from 'components/ui/AlertError'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { CronJob, useCronJobsQuery } from 'data/database-cron-jobs/database-cron-jobs-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { Button, Sheet, SheetContent } from 'ui'
import EnableExtensionModal from '../Extensions/EnableExtensionModal'
import { CreateCronJobSheet } from './CreateCronJobSheet'
import { CronJobCard } from './CronJobCard'
import { CronJobsDisabledState } from './CronJobsDisabledState'
import DeleteCronJob from './DeleteCronJob'

export const CronJobsListing = () => {
  const { project } = useProjectContext()

  const [showEnableExtensionModal, setShowEnableExtensionModal] = useState(false)
  // used for confirmation prompt in the Create Cron Job Sheet
  const [isClosingCreateCronJobSheet, setIsClosingCreateCronJobSheet] = useState(false)
  const [createCronJobSheetShown, setCreateCronJobSheetShown] = useState<
    Pick<CronJob, 'jobname' | 'schedule' | 'active' | 'command'> | undefined
  >()
  const [cronJobForDeletion, setCronJobForDeletion] = useState<CronJob | undefined>()

  const {
    data: cronJobs,
    error,
    isLoading,
    isError,
    refetch,
  } = useCronJobsQuery({
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
    // refetch the cron jobs afte the pgcron extension has been installed
    if (pgCronExtensionInstalled && isError) {
      refetch()
    }
  }, [isError, pgCronExtensionInstalled, refetch])

  // this avoid showing loading screen when the extension is not installed. Otherwise, we'll have to wait for three
  // retries (which are sure to fail because the extension is not installed)
  if (isLoadingExtensions) return <GenericSkeletonLoader />
  if (!pgCronExtensionInstalled) return <CronJobsDisabledState />
  if (isLoading) return <GenericSkeletonLoader />
  if (isError) return <AlertError error={error} subject="Failed to retrieve database cron jobs" />

  return (
    <>
      {(cronJobs ?? []).length == 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <ProductEmptyState
            title="Cron Jobs"
            ctaButtonLabel="Create a new cron job"
            onClickCta={() =>
              setCreateCronJobSheetShown({
                jobname: '',
                schedule: '',
                command: '',
                active: true,
              })
            }
          >
            <p className="text-sm text-foreground-light">
              Cron jobs in PostgreSQL allow you to schedule and automate tasks such as running SQL
              queries or maintenance routines at specified intervals. These jobs are managed using
              cron-like syntax and are executed directly within the PostgreSQL server, making it
              easy to schedule recurring tasks without needing an external scheduler.
            </p>
          </ProductEmptyState>
        </div>
      ) : (
        <div className="w-full space-y-4">
          <FormHeader
            title="Cron jobs"
            description="Use cron jobs to schedule and automate tasks such as running SQL queries or maintenance routines at specified intervals."
            actions={
              <>
                <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
                  <Link
                    href="https://supabase.com/docs/guides/database/extensions/pg_cron"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Documentation
                  </Link>
                </Button>
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
          {cronJobs.map((job) => (
            <CronJobCard
              job={job}
              onEditCronJob={(job) => setCreateCronJobSheetShown(job)}
              onDeleteCronJob={(job) => setCronJobForDeletion(job)}
            />
          ))}
        </div>
      )}
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
      <DeleteCronJob
        visible={!!cronJobForDeletion}
        onClose={() => setCronJobForDeletion(undefined)}
        cronJob={cronJobForDeletion!}
      />

      <EnableExtensionModal
        visible={showEnableExtensionModal}
        extension={pgCronExtension}
        onCancel={() => setShowEnableExtensionModal(false)}
      />
    </>
  )
}
