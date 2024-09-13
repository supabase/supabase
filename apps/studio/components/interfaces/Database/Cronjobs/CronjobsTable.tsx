import { PermissionAction } from '@supabase/shared-types/out/constants'
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
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { Input, Sheet, SheetContent } from 'ui'
import { CronjobsList } from './CronjobsList'
import { EditCronjobPanel } from './EditCronjobPanel'

interface CronjobsTableProps {}

export const CronjobsTable = ({}: CronjobsTableProps) => {
  const { project } = useProjectContext()
  const router = useRouter()
  const { search } = useParams()
  const [cronjobForEditing, setCronjobForEditing] = useState<Cronjob | undefined>()
  const [cronjobForDeletion, setCronjobForDeletion] = useState<Cronjob | undefined>()

  const canReadFunctions = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'functions')
  const isPermissionsLoaded = usePermissionsLoaded()

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

  const canCreateCronjobs = true
  // const canCreateFunctions = useCheckPermissions(
  //   PermissionAction.TENANT_SQL_ADMIN_WRITE,
  //   'functions'
  // )

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
            title="Functions"
            ctaButtonLabel="Create a new cron job"
            onClickCta={() => createFunction()}
            disabled={!canCreateCronjobs}
            disabledMessage="You need additional permissions to create functions"
          >
            <p className="text-sm text-foreground-light">
              PostgreSQL functions, also known as stored procedures, is a set of SQL and procedural
              commands such as declarations, assignments, loops, flow-of-control, etc.
            </p>
            <p className="text-sm text-foreground-light">
              It's stored on the database server and can be invoked using the SQL interface.
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
                editCronjob={(job) => setCronjobForEditing(job)}
                deleteCronjob={(job) => setCronjobForDeletion(job)}
              />
            }
          />
        </div>
      )}
      <>
        <Sheet open={!!cronjobForEditing} onOpenChange={() => setCronjobForEditing(undefined)}>
          <SheetContent size="default">
            <EditCronjobPanel
              visible={!!cronjobForEditing}
              onClose={() => setCronjobForEditing(undefined)}
            />
          </SheetContent>
        </Sheet>
      </>
    </>
  )
}
