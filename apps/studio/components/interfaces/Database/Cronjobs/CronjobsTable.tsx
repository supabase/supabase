import { Search } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { Cronjob, useCronjobsQuery } from 'data/database-cronjobs/database-cronjobs-query'
import { Button, Input, Sheet, SheetContent } from 'ui'
import { CreateCronjobSheet } from './CreateCronjobSheet'
import { CronjobsList } from './CronjobsList'
import DeleteCronjob from './DeleteCronjob'

interface CronjobsTableProps {}

export const CronjobsTable = ({}: CronjobsTableProps) => {
  const { project } = useProjectContext()
  const router = useRouter()
  const { search } = useParams()

  // used for confirmation prompt in the Create Cronjob Sheet
  const [isClosingCreateCronJobSheet, setIsClosingCreateCronJobSheet] = useState(false)
  const [createCronJobSheetShown, setCreateCronJobSheetShown] = useState<
    Pick<Cronjob, 'jobname' | 'schedule' | 'active' | 'command'> | undefined
  >()
  const [cronjobForDeletion, setCronjobForDeletion] = useState<Cronjob | undefined>()

  const filterString = search ?? ''

  const setFilterString = (str: string) => {
    const url = new URL(document.URL)
    if (str === '') {
      url.searchParams.delete('search')
    } else {
      url.searchParams.set('search', str)
    }
    router.push(url)
  }

  const {
    data: cronjobs,
    error,
    isLoading,
    isError,
  } = useCronjobsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  if (isLoading) return <GenericSkeletonLoader />
  if (isError) return <AlertError error={error} subject="Failed to retrieve database functions" />

  return (
    <>
      {(cronjobs ?? []).length == 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <ProductEmptyState
            title="Cron jobs"
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
              pgcron jobs in PostgreSQL allow you to schedule and automate tasks such as running SQL
              queries or maintenance routines at specified intervals. These jobs are managed using
              cron-like syntax and are executed directly within the PostgreSQL server, making it
              easy to schedule recurring tasks without needing an external scheduler.
            </p>
          </ProductEmptyState>
        </div>
      ) : (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search for a cronjob"
                size="small"
                icon={<Search size={14} />}
                value={filterString}
                className="w-64"
                onChange={(e) => setFilterString(e.target.value)}
              />
            </div>
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
          </div>

          {/* {isLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="functions" />} */}

          <Table
            className="table-fixed overflow-x-auto"
            head={
              <>
                <Table.th key="name">Name</Table.th>
                <Table.th key="Schedule" className="table-cell">
                  Schedule
                </Table.th>
                <Table.th key="active" className="table-cell">
                  Active
                </Table.th>
                <Table.th key="command" className="table-cell">
                  Command
                </Table.th>
                <Table.th key="buttons" className="w-1/6"></Table.th>
              </>
            }
            body={
              <CronjobsList
                filterString={filterString}
                editCronjob={(job) => setCreateCronJobSheetShown(job)}
                deleteCronjob={(job) => setCronjobForDeletion(job)}
              />
            }
          />
        </div>
      )}
      <Sheet
        open={!!createCronJobSheetShown}
        onOpenChange={() => setIsClosingCreateCronJobSheet(true)}
      >
        <SheetContent size="default" tabIndex={undefined}>
          <CreateCronjobSheet
            selectedCronjob={createCronJobSheetShown}
            onClose={() => {
              setIsClosingCreateCronJobSheet(false)
              setCreateCronJobSheetShown(undefined)
            }}
            isClosing={isClosingCreateCronJobSheet}
            setIsClosing={setIsClosingCreateCronJobSheet}
          />
        </SheetContent>
      </Sheet>
      <DeleteCronjob
        visible={!!cronjobForDeletion}
        onClose={() => setCronjobForDeletion(undefined)}
        cronjob={cronjobForDeletion!}
      />
    </>
  )
}
