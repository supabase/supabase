import { useParams } from 'common'
import dayjs from 'dayjs'
import { Archive, Cpu, Database, GitBranch, Github } from 'lucide-react'
import { useMemo } from 'react'
import { cn, Skeleton } from 'ui'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { HighAvailabilityBadge } from './HighAvailabilityBadge'
import { ServiceStatus } from './ServiceStatus'
import { ComputeBadgeWrapper } from '@/components/ui/ComputeBadgeWrapper'
import { DisableInteraction } from '@/components/ui/DisableInteraction'
import { SingleStat } from '@/components/ui/SingleStat'
import { useBranchesQuery } from '@/data/branches/branches-query'
import { useBackupsQuery } from '@/data/database/backups-query'
import { DatabaseMigration, useMigrationsQuery } from '@/data/database/migrations-query'
import { useGitHubConnectionsQuery } from '@/data/integrations/github-connections-query'
import { useResourceWarningsQuery } from '@/data/usage/resource-warnings-query'
import { useHighAvailability } from '@/hooks/misc/useHighAvailability'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import { EMPTY_ARR } from '@/lib/void'

interface BranchStatValueProps {
  currentBranch?: { created_at?: string }
  isDefaultProject: boolean
  isError: boolean
  isHighAvailability: boolean
  isLoading: boolean
  latestNonDefaultBranch?: { name?: string }
}

export const BranchStatValue = ({
  currentBranch,
  isDefaultProject,
  isError,
  isHighAvailability,
  isLoading,
  latestNonDefaultBranch,
}: BranchStatValueProps) => {
  if (isHighAvailability) {
    return <p className="text-foreground-lighter">Unavailable</p>
  }

  if (isLoading) {
    return <Skeleton className="h-6 w-24" />
  }

  if (isError) {
    return <p className="text-foreground-lighter">Unable to load</p>
  }

  if (isDefaultProject) {
    return (
      <p
        className={cn('truncate min-w-0', !latestNonDefaultBranch && 'text-foreground-lighter')}
        title={latestNonDefaultBranch?.name ?? 'No branches'}
      >
        {latestNonDefaultBranch?.name ?? 'No branches'}
      </p>
    )
  }

  if (currentBranch?.created_at) {
    return (
      <TimestampInfo
        className="text-base"
        label={dayjs(currentBranch.created_at).fromNow()}
        utcTimestamp={currentBranch.created_at}
      />
    )
  }

  return <p className="text-foreground-lighter">Unknown</p>
}

export const ActivityStats = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { isHighAvailability } = useHighAvailability()
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: resourceWarnings } = useResourceWarningsQuery({ slug: organization?.slug })
  const projectResourceWarnings = resourceWarnings?.find((warning) => warning.project === ref)
  const parentProjectRef = project?.parent_project_ref ?? project?.ref

  const {
    data: branchesData,
    isPending: isLoadingBranches,
    isError: isBranchesError,
  } = useBranchesQuery(
    {
      projectRef: parentProjectRef,
    },
    { enabled: !isHighAvailability }
  )
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

  const { data: migrationsData = EMPTY_ARR, isPending: isLoadingMigrations } = useMigrationsQuery({
    projectRef: project?.ref,
    projectStatus: project?.status,
    connectionString: project?.connectionString,
  })
  const latestMigration = useMemo<DatabaseMigration | undefined>(
    () => migrationsData[0],
    [migrationsData]
  )
  const migrationLabelText =
    migrationsData.length === 0 ? 'No migrations' : (latestMigration?.name ?? 'Unknown')

  const { data: backupsData, isPending: isLoadingBackups } = useBackupsQuery({
    projectRef: project?.ref,
    projectStatus: project?.status,
  })
  const latestBackup = useMemo(() => {
    const list = backupsData?.backups ?? []
    if (list.length === 0) return undefined
    return list
      .slice()
      .sort((a, b) => new Date(b.inserted_at).valueOf() - new Date(a.inserted_at).valueOf())[0]
  }, [backupsData])

  const { data: githubConnections, isPending: isLoadingGithubConnections } =
    useGitHubConnectionsQuery({ organizationId: organization?.id }, { enabled: !!organization?.id })
  const githubConnection = githubConnections?.find(
    (connection) => connection.project.ref === parentProjectRef
  )
  const isProjectComingUp = [PROJECT_STATUS.COMING_UP, PROJECT_STATUS.UNKNOWN].includes(
    project?.status ?? PROJECT_STATUS.UNKNOWN
  )
  const githubLabelText = githubConnection?.repository.name
    ? githubConnection.repository.name
    : isProjectComingUp
      ? 'Waiting for project...'
      : 'No repository connected'
  const integrationsPath = parentProjectRef
    ? `/project/${parentProjectRef}/settings/integrations`
    : undefined

  return (
    <div className="@container">
      <div className="grid grid-cols-1 @md:grid-cols-2 gap-2 @md:gap-6 flex-wrap">
        <ServiceStatus />

        <SingleStat
          icon={<Cpu size={18} strokeWidth={1.5} className="text-foreground" />}
          label={<span>Compute</span>}
          value={
            <div className="flex items-center gap-x-2 gap-y-1 flex-wrap">
              {project?.infra_compute_size ? (
                <ComputeBadgeWrapper
                  projectRef={project?.ref}
                  slug={organization?.slug}
                  cloudProvider={project?.cloud_provider}
                  computeSize={project.infra_compute_size}
                  resourceWarnings={projectResourceWarnings}
                />
              ) : (
                <p className="text-foreground-lighter">Unknown</p>
              )}
              {project?.high_availability && <HighAvailabilityBadge />}
            </div>
          }
        />

        <SingleStat
          href={integrationsPath}
          icon={<Github size={18} strokeWidth={1.5} className="text-foreground" />}
          label={<span>GitHub</span>}
          value={
            isLoadingGithubConnections ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <p
                className={cn('truncate min-w-0', !githubConnection && 'text-foreground-lighter')}
                title={githubLabelText}
              >
                {githubLabelText}
              </p>
            )
          }
        />

        <DisableInteraction disabled={isHighAvailability} aria-disabled={isHighAvailability}>
          <SingleStat
            href={isHighAvailability ? undefined : `/project/${ref}/branches`}
            icon={<GitBranch size={18} strokeWidth={1.5} className="text-foreground" />}
            label={<span>{isDefaultProject ? 'Recent branch' : 'Branch Created'}</span>}
            trackingProperties={{
              stat_type: 'branches',
              stat_value: branchesData?.length ?? 0,
            }}
            value={
              <BranchStatValue
                currentBranch={currentBranch}
                isDefaultProject={isDefaultProject}
                isError={isBranchesError}
                isHighAvailability={isHighAvailability}
                isLoading={isLoadingBranches}
                latestNonDefaultBranch={latestNonDefaultBranch}
              />
            }
          />
        </DisableInteraction>

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
            ) : (
              <p
                className={cn(
                  'truncate min-w-0',
                  !!latestMigration ? 'text-foreground' : 'text-foreground-lighter'
                )}
                title={migrationLabelText}
              >
                {migrationLabelText}
              </p>
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
      </div>
    </div>
  )
}
