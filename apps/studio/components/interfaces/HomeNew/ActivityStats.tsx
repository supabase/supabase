import { useParams } from 'common'
import { SingleStat } from 'components/ui/SingleStat'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useBackupsQuery } from 'data/database/backups-query'
import { DatabaseMigration, useMigrationsQuery } from 'data/database/migrations-query'
import dayjs from 'dayjs'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { parseMigrationVersion } from 'lib/migration-utils'
import { Archive, Database, GitBranch } from 'lucide-react'
import { useMemo } from 'react'
import { cn, Skeleton } from 'ui'
import { TimestampInfo } from 'ui-patterns'

import { ServiceStatus } from './ServiceStatus'

export const ActivityStats = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { data: branchesData, isPending: isLoadingBranches } = useBranchesQuery({
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

  const { data: migrationsData, isPending: isLoadingMigrations } = useMigrationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const latestMigration = useMemo<DatabaseMigration | undefined>(
    () => (migrationsData ?? [])[0],
    [migrationsData]
  )

  const { data: backupsData, isPending: isLoadingBackups } = useBackupsQuery({
    projectRef: project?.ref,
  })
  const latestBackup = useMemo(() => {
    const list = backupsData?.backups ?? []
    if (list.length === 0) return undefined
    return list
      .slice()
      .sort((a, b) => new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf())[0]
  }, [backupsData])

  const [versionLabel, versionTimestamp] = useMemo(() => {
    const version = latestMigration?.version

    const versionDayjs = parseMigrationVersion(version)
    if (versionDayjs) {
      return [versionDayjs.fromNow(), versionDayjs.toISOString()]
    }

    return [undefined, undefined]
  }, [latestMigration])

  const hasValidVersion = versionLabel && versionTimestamp

  const versionLabelText = migrationsData && migrationsData.length > 0 ? 'Unknown' : 'No migrations'

  return (
    <div className="@container">
      <div className="grid grid-cols-1 @md:grid-cols-2 gap-2 @md:gap-6 flex-wrap">
        <ServiceStatus />

        <SingleStat
          href={`/project/${ref}/database/migrations`}
          icon={<Database size={18} strokeWidth={1.5} className="text-foreground" />}
          label={<span>Last migration</span>}
          trackingProperties={{
            stat_type: 'migrations',
            stat_value: migrationsData?.length ?? 0,
          }}
          value={
            isLoadingMigrations ? (
              <Skeleton className="h-6 w-24" />
            ) : hasValidVersion ? (
              <TimestampInfo
                className="text-base"
                label={versionLabel}
                utcTimestamp={versionTimestamp}
              />
            ) : (
              <p className="text-foreground-lighter">{versionLabelText}</p>
            )
          }
        />

        <SingleStat
          href={`/project/${ref}/database/backups/scheduled`}
          icon={<Archive size={18} strokeWidth={1.5} className="text-foreground" />}
          label={<span>Last backup</span>}
          trackingProperties={{
            stat_type: 'backups',
            stat_value: backupsData?.backups?.length ?? 0,
          }}
          value={
            isLoadingBackups ? (
              <Skeleton className="h-6 w-24" />
            ) : backupsData?.pitr_enabled ? (
              <p>PITR enabled</p>
            ) : latestBackup ? (
              <TimestampInfo
                className="text-base"
                displayAs="utc"
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
          trackingProperties={{
            stat_type: 'branches',
            stat_value: branchesData?.length ?? 0,
          }}
          value={
            isLoadingBranches ? (
              <Skeleton className="h-6 w-24" />
            ) : isDefaultProject ? (
              <p
                className={cn(
                  'truncate',
                  !latestNonDefaultBranch && 'text-foreground-lighter truncate'
                )}
                title={latestNonDefaultBranch?.name ?? 'No branches'}
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
