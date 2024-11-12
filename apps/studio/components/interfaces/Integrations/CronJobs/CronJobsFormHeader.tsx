import { Button, Sheet, SheetContent } from 'ui'
import { DocsButton } from 'components/ui/DocsButton'
import { useState } from 'react'
import { CronJob } from 'data/database-cron-jobs/database-cron-jobs-query'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { CreateCronJobSheet } from './CreateCronJobSheet'

export const CronJobsFormHeader = () => {
  const [createCronJobSheetShown, setCreateCronJobSheetShown] = useState<
    Pick<CronJob, 'jobname' | 'schedule' | 'active' | 'command'> | undefined
  >()

  const [isClosingCreateCronJobSheet, setIsClosingCreateCronJobSheet] = useState(false)

  return (
    <>
      <FormHeader
        title="Cron jobs"
        description="Schedule and automate tasks like running queries or maintenance routines at specified intervals"
        className="pt-6 px-6"
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
    </>
  )
}
