import { PermissionAction } from '@supabase/shared-types/out/constants'
import { includes, sortBy } from 'lodash'
import { Check, Edit3, MoreVertical, Trash, X } from 'lucide-react'
import { useRouter } from 'next/router'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Cronjob, useCronjobsQuery } from 'data/database-cronjobs/database-cronjobs-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

interface CronjobsListProps {
  filterString: string
  editCronjob: (job: Cronjob) => void
  deleteCronjob: (job: Cronjob) => void
}

export const CronjobsList = ({
  filterString = '',
  editCronjob,
  deleteCronjob,
}: CronjobsListProps) => {
  const router = useRouter()
  const { project: selectedProject } = useProjectContext()

  const {
    data: cronjobs,
    error,
    isLoading,
    isError,
  } = useCronjobsQuery({
    projectRef: selectedProject?.ref,
    connectionString: selectedProject?.connectionString,
  })

  const filteredCronjobs = (cronjobs ?? []).filter((x) =>
    includes(x.jobname.toLowerCase(), filterString.toLowerCase())
  )
  const sortedCronjobs = sortBy(filteredCronjobs, (func) => func.jobname.toLocaleLowerCase())
  const projectRef = selectedProject?.ref
  const canUpdateFunctions = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'functions'
  )

  if (sortedCronjobs.length === 0 && filterString.length === 0) {
    return (
      <Table.tr>
        <Table.td colSpan={5}>
          <p className="text-sm text-foreground">No functions created yet</p>
          <p className="text-sm text-foreground-light">There are no cronjobs found</p>
        </Table.td>
      </Table.tr>
    )
  }

  if (sortedCronjobs.length === 0 && filterString.length > 0) {
    return (
      <Table.tr>
        <Table.td colSpan={5}>
          <p className="text-sm text-foreground">No results found</p>
          <p className="text-sm text-foreground-light">
            Your search for "{filterString}" did not return any results
          </p>
        </Table.td>
      </Table.tr>
    )
  }

  return (
    <>
      {sortedCronjobs.map((x) => {
        return (
          <Table.tr key={x.jobid}>
            <Table.td className="truncate">
              <p title={x.jobname}>{x.jobname}</p>
            </Table.td>
            <Table.td className="table-cell overflow-auto">
              <p title={x.schedule} className="truncate">
                {x.schedule}
              </p>
            </Table.td>
            <Table.td className="table-cell">
              {x.active ? (
                <Check size={18} strokeWidth={2} className="text-brand" />
              ) : (
                <X size={18} strokeWidth={2} className="text-foreground-lighter" />
              )}
            </Table.td>
            <Table.td className="table-cell">{x.command}</Table.td>
            <Table.td className="text-right">
              <div className="flex items-center justify-end">
                {canUpdateFunctions ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="default" className="px-1" icon={<MoreVertical />} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="left">
                      <DropdownMenuItem className="space-x-2" onClick={() => editCronjob(x)}>
                        <Edit3 size={14} />
                        <p>Edit cronjob</p>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="space-x-2" onClick={() => deleteCronjob(x)}>
                        <Trash stroke="red" size={14} />
                        <p>Delete cronjob</p>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <ButtonTooltip
                    disabled
                    type="default"
                    icon={<MoreVertical />}
                    className="px-1"
                    tooltip={{
                      content: {
                        side: 'left',
                        text: 'You need additional permissions to update functions',
                      },
                    }}
                  />
                )}
              </div>
            </Table.td>
          </Table.tr>
        )
      })}
    </>
  )
}
