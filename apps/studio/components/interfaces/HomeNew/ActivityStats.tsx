import dayjs from 'dayjs'
import { Archive, Database, GitBranch } from 'lucide-react'
import { useMemo } from 'react'

import { useParams } from 'common'
import { SingleStat } from 'components/ui/SingleStat'
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-wrap">
        <ServiceStatus />

        <SingleStat
          href={`/project/${ref}/database/migrations`}
          icon={<Database size={18} strokeWidth={1.5} className="text-foreground" />}
          label={<span>Last migration</span>}
          value={
            isLoadingMigrations ? (
              <Skeleton className="h-6 w-24" />
            ) : latestMigration ? (
              <TimestampInfo
                className="text-base"
                label={dayjs(latestMigration.version, 'YYYYMMDDHHmmss').fromNow()}
                utcTimestamp={dayjs(latestMigration.version, 'YYYYMMDDHHmmss').toISOString()}
              />
            ) : (
              <p className="text-foreground-lighter">No migrations</p>
            )
          }
        />

        <SingleStat
          href={`/project/${ref}/database/backups/scheduled`}
          icon={<Archive size={18} strokeWidth={1.5} className="text-foreground" />}
          label={<span>Last backup</span>}
          value={
            isLoadingBackups ? (
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
            )
          }
        />

        <SingleStat
          href={`/project/${ref}/branches`}
          icon={<GitBranch size={18} strokeWidth={1.5} className="text-foreground" />}
          label={<span>{isDefaultProject ? 'Recent branch' : 'Branch Created'}</span>}
          value={
            isLoadingBranches ? (
              <Skeleton className="h-6 w-24" />
            ) : isDefaultProject ? (
              <p
                className={cn(
                  'truncate',
                  !latestNonDefaultBranch && 'text-foreground-lighter truncate'
                )}
              >
                {latestNonDefaultBranch?.name ?? 'No branches'}
              </p>
            ) : currentBranch?.created_at ? (
              <TimestampInfo
                className="text-base"
                label={dayjs(currentBranch.created_at).fromNow()}
                utcTimestamp={currentBranch.created_at}
              />
            ) : (
              <p className="text-foreground-lighter">Unknown</p>
            )
          }
        />
      </div>
    </div>
  )
}
