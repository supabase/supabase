import dayjs from 'dayjs'
import Link from 'next/link'
import { useParams } from 'common'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useMigrationsQuery } from 'data/database/migrations-query'
import { useBackupsQuery } from 'data/database/backups-query'
import { Skeleton } from 'ui'
import { ServiceStatus } from './ServiceStatus'
import { GitBranch } from 'lucide-react'

export function ActivityStats() {
  const { data: project } = useSelectedProjectQuery()
  const { ref } = useParams()

  const { data: branchesData, isLoading: isLoadingBranches } = useBranchesQuery({
    projectRef: project?.parent_project_ref ?? project?.ref,
  })
  const isDefaultProject = project?.parent_project_ref === undefined
  const currentBranch = (branchesData ?? []).find((b) => b.project_ref === ref)
  const latestNonDefaultBranch = (branchesData ?? [])
    .filter((b) => !b.is_default)
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at ?? b.updated_at).valueOf() -
        new Date(a.created_at ?? a.updated_at).valueOf()
    )[0]

  const { data: migrationsData, isLoading: isLoadingMigrations } = useMigrationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const latestMigration = (migrationsData ?? [])[0]

  const { data: backupsData, isLoading: isLoadingBackups } = useBackupsQuery({
    projectRef: project?.ref,
  })
  const latestBackup = (backupsData?.backups ?? [])
    .slice()
    .sort((a, b) => new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf())[0]

  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-4 @md:grid-cols-4">
        <div className="block">
          <p className="heading-meta text-foreground-light">Status</p>
          <div className="flex items-center gap-2 mt-1">
            <ServiceStatus />
          </div>
        </div>
        <Link href={`/project/${ref}/database/migrations`} className="block">
          <p className="heading-meta text-foreground-light mb-1">Last migration</p>
          <p className="text-foreground">
            {isLoadingMigrations ? (
              <Skeleton className="h-4 w-16 mt-2" />
            ) : latestMigration ? (
              dayjs(latestMigration.version, 'YYYYMMDDHHmmss').fromNow()
            ) : (
              'No migrations'
            )}
          </p>
        </Link>
        <Link href={`/project/${ref}/database/backups/scheduled`} className="block">
          <p className="heading-meta text-foreground-light mb-1">Last backup</p>
          <p className="text-foreground">
            {isLoadingBackups ? (
              <Skeleton className="h-4 w-16 mt-2" />
            ) : backupsData?.pitr_enabled ? (
              'PITR enabled'
            ) : latestBackup ? (
              dayjs(latestBackup.inserted_at).fromNow()
            ) : (
              'No backups'
            )}
          </p>
        </Link>
        <Link href={`/project/${ref}/branches`} className="block">
          <h4 className="heading-meta text-foreground-light mb-1">
            {isDefaultProject ? 'Recent branch' : 'Branch Created'}
          </h4>
          <p className="text-foreground">
            {isLoadingBranches ? (
              <Skeleton className="h-4 w-24 mt-2" />
            ) : isDefaultProject ? (
              <div className="flex items-center gap-2">
                <GitBranch size={16} strokeWidth={1.5} className="text-foreground-muted" />
                {latestNonDefaultBranch?.name ?? 'No branches'}
              </div>
            ) : currentBranch?.created_at ? (
              dayjs(currentBranch.created_at).fromNow()
            ) : (
              'Unknown'
            )}
          </p>
        </Link>
      </div>
    </div>
  )
}

export default ActivityStats
