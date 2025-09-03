import dayjs from 'dayjs'
import { GitBranch } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

import { useParams } from 'common'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useBackupsQuery } from 'data/database/backups-query'
import { useMigrationsQuery } from 'data/database/migrations-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Skeleton } from 'ui'
import { ServiceStatus } from './ServiceStatus'

export const ActivityStats = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { data: branchesData, isLoading: isLoadingBranches } = useBranchesQuery({
    projectRef: project?.parent_project_ref ?? project?.ref,
  })
  const isDefaultProject = project?.parent_project_ref === undefined
  const currentBranch = useMemo(
    () => (branchesData ?? []).find((b) => b.project_ref === ref),
    [branchesData, ref]
  )
  const latestNonDefaultBranch = useMemo(() => {
    const list = (branchesData ?? []).filter((b) => !b.is_default)
    if (list.length === 0) return undefined
    return list
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_at ?? b.updated_at).valueOf() -
          new Date(a.created_at ?? a.updated_at).valueOf()
      )[0]
  }, [branchesData])

  const { data: migrationsData, isLoading: isLoadingMigrations } = useMigrationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const latestMigration = useMemo(() => (migrationsData ?? [])[0], [migrationsData])

  const { data: backupsData, isLoading: isLoadingBackups } = useBackupsQuery({
    projectRef: project?.ref,
  })
  const latestBackup = useMemo(() => {
    const list = backupsData?.backups ?? []
    if (list.length === 0) return undefined
    return list
      .slice()
      .sort((a, b) => new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf())[0]
  }, [backupsData])

  return (
    <div className="@container">
      <div className="grid grid-cols-2 xl:flex xl:gap-10 gap-4 flex-wrap">
        <div className="block">
          <p className="heading-meta text-foreground-light mb-1">Status</p>
          <ServiceStatus />
        </div>
        <Link className="block" href={`/project/${ref}/database/migrations`}>
          <p className="heading-meta text-foreground-light mb-1">Last migration</p>
          {isLoadingMigrations ? (
            <Skeleton className="h-4 w-16 mt-2" />
          ) : (
            <p className="text-foreground h-[34px] flex items-center capitalize-sentence">
              {latestMigration
                ? dayjs(latestMigration.version, 'YYYYMMDDHHmmss').fromNow()
                : 'No migrations'}
            </p>
          )}
        </Link>
        <Link className="block" href={`/project/${ref}/database/backups/scheduled`}>
          <p className="heading-meta text-foreground-light mb-1">Last backup</p>
          {isLoadingBackups ? (
            <Skeleton className="h-4 w-16 mt-2" />
          ) : (
            <p className="text-foreground h-[34px] flex items-center capitalize-sentence">
              {backupsData?.pitr_enabled
                ? 'PITR enabled'
                : latestBackup
                  ? dayjs(latestBackup.inserted_at).fromNow()
                  : 'No backups'}
            </p>
          )}
        </Link>
        <Link className="block" href={`/project/${ref}/branches`}>
          <h4 className="heading-meta text-foreground-light mb-1">
            {isDefaultProject ? 'Recent branch' : 'Branch Created'}
          </h4>

          {isLoadingBranches ? (
            <Skeleton className="h-4 w-24 mt-2" />
          ) : (
            <div className="text-foreground truncate h-[34px] flex items-center capitalize-sentence">
              {isDefaultProject ? (
                <div className="flex items-center gap-2">
                  <GitBranch size={16} strokeWidth={1.5} className="text-foreground-lighter" />
                  <p className="truncate">{latestNonDefaultBranch?.name ?? 'No branches'}</p>
                </div>
              ) : currentBranch?.created_at ? (
                dayjs(currentBranch.created_at).fromNow()
              ) : (
                'Unknown'
              )}
            </div>
          )}
        </Link>
      </div>
    </div>
  )
}
