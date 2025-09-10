import dayjs from 'dayjs'
import { GitBranch } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

import { useParams } from 'common'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useBackupsQuery } from 'data/database/backups-query'
import { useMigrationsQuery } from 'data/database/migrations-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { cn, Skeleton } from 'ui'
import { TimestampInfo } from 'ui-patterns'
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
          <h4 className="heading-meta text-foreground-light mb-1">Last migration</h4>

          <div className={cn('h-[34px] flex items-center capitalize-sentence')}>
            {isLoadingMigrations ? (
              <Skeleton className="h-6 w-24" />
            ) : latestMigration ? (
              <TimestampInfo
                className="text-base"
                label={dayjs(latestMigration.version, 'YYYYMMDDHHmmss').fromNow()}
                utcTimestamp={dayjs(latestMigration.version, 'YYYYMMDDHHmmss').toISOString()}
              />
            ) : (
              <p className="text-foreground-lighter">No migrations</p>
            )}
          </div>
        </Link>

        <Link className="block" href={`/project/${ref}/database/backups/scheduled`}>
          <h4 className="heading-meta text-foreground-light mb-1">Last backup</h4>

          <div className={cn('h-[34px] flex items-center capitalize-sentence')}>
            {isLoadingBackups ? (
              <Skeleton className="h-6 w-24" />
            ) : backupsData?.pitr_enabled ? (
              <p>PITR enabled</p>
            ) : latestBackup ? (
              <TimestampInfo
                className="text-base"
                label={dayjs(latestBackup.inserted_at).fromNow()}
                utcTimestamp={latestBackup.inserted_at}
              />
            ) : (
              <p className="text-foreground-lighter">No backups</p>
            )}
          </div>
        </Link>

        <Link className="block" href={`/project/${ref}/branches`}>
          <h4 className="heading-meta text-foreground-light mb-1">
            {isDefaultProject ? 'Recent branch' : 'Branch Created'}
          </h4>

          <div className="text-foreground truncate h-[34px] flex items-center capitalize-sentence">
            {isLoadingBranches ? (
              <Skeleton className="h-6 w-24" />
            ) : isDefaultProject ? (
              <div className="flex items-center gap-2">
                <GitBranch size={16} strokeWidth={1.5} className="text-foreground-lighter" />
                <p className={cn('truncate', !latestNonDefaultBranch && 'text-foreground-lighter')}>
                  {latestNonDefaultBranch?.name ?? 'No branches'}
                </p>
              </div>
            ) : currentBranch?.created_at ? (
              <TimestampInfo
                className="text-base"
                label={dayjs(currentBranch.created_at).fromNow()}
                utcTimestamp={currentBranch.created_at}
              />
            ) : (
              <p className="text-foreground-lighter">Unknown</p>
            )}
          </div>
        </Link>
      </div>
    </div>
  )
}
