import { includes, sortBy } from 'lodash'
import { Check, Edit3, Loader2, MoreVertical, Trash, X } from 'lucide-react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import { Cronjob, useCronjobsQuery } from 'data/database-cronjobs/database-cronjobs-query'
import { useDatabaseCronjobToggleMutation } from 'data/database-cronjobs/database-cronjobs-toggle-mutation'
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

const CronjobRow = ({
  job,
  editCronjob,
  deleteCronjob,
}: {
  job: Cronjob
  editCronjob: (job: Cronjob) => void
  deleteCronjob: (job: Cronjob) => void
}) => {
  const { project: selectedProject } = useProjectContext()
  const { mutate: toggleDatabaseCronjob, isLoading } = useDatabaseCronjobToggleMutation()

  return (
    <Table.tr>
      <Table.td className="truncate">
        <p title={job.jobname}>{job.jobname}</p>
      </Table.td>
      <Table.td className="table-cell overflow-auto">
        <p title={job.schedule} className="truncate">
          {job.schedule}
        </p>
      </Table.td>
      <Table.td className="table-cell">
        {isLoading ? (
          <Loader2 size={18} strokeWidth={2} className="animate-spin text-foreground-muted" />
        ) : job.active ? (
          <Check size={18} strokeWidth={2} className="text-brand" />
        ) : (
          <X size={18} strokeWidth={2} className="text-foreground-lighter" />
        )}
      </Table.td>
      <Table.td className="table-cell">{job.command}</Table.td>
      <Table.td className="text-right">
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="default" className="px-1" icon={<MoreVertical />} />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="left">
              <DropdownMenuItem className="space-x-2" onClick={() => editCronjob(job)}>
                <Edit3 size={14} />
                <p>Edit cronjob</p>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="space-x-2"
                onClick={() =>
                  toggleDatabaseCronjob({
                    projectRef: selectedProject?.ref!,
                    connectionString: selectedProject?.connectionString,
                    jobId: job.jobid,
                    active: !job.active,
                  })
                }
              >
                <Edit3 size={14} />
                <p>{job.active ? `Deactivate cronjob` : `Activate cronjob`}</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="space-x-2" onClick={() => deleteCronjob(job)}>
                <Trash stroke="red" size={14} />
                <p>Delete cronjob</p>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Table.td>
    </Table.tr>
  )
}

export const CronjobsList = ({
  filterString = '',
  editCronjob,
  deleteCronjob,
}: CronjobsListProps) => {
  const { project: selectedProject } = useProjectContext()

  const { data: cronjobs } = useCronjobsQuery({
    projectRef: selectedProject?.ref,
    connectionString: selectedProject?.connectionString,
  })

  const filteredCronjobs = (cronjobs ?? []).filter((x) =>
    includes(x.jobname.toLowerCase(), filterString.toLowerCase())
  )
  const sortedCronjobs = sortBy(filteredCronjobs, (func) => func.jobname.toLocaleLowerCase())

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
      {sortedCronjobs.map((job) => (
        <CronjobRow
          key={job.jobid}
          job={job}
          editCronjob={editCronjob}
          deleteCronjob={deleteCronjob}
        />
      ))}
    </>
  )
}
