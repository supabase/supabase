import { useParams } from 'common'
import { PLAN_DETAILS } from 'components/interfaces/DiskManagement/ui/DiskManagement.constants'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import { useProjectUpgradeEligibilityQuery } from 'data/config/project-upgrade-eligibility-query'
import { useProjectUpgradingStatusQuery } from 'data/config/project-upgrade-status-query'
import { useInvalidateProjectDetailsQuery } from 'data/projects/project-detail-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { CompletedState, FailedState, UpgradingState, WaitingState } from './states'
import { deriveUpgradeState, UPGRADE_STATE_CONTENT } from './types'

const formatValue = ({
  postgres_version,
  release_channel,
}: {
  postgres_version: number
  release_channel: string
}) => {
  return `${postgres_version}|${release_channel}`
}

export const PostgresUpgradePanel = () => {
  const router = useRouter()
  const { ref } = useParams()
  const queryParams = useSearchParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const { invalidateProjectDetailsQuery } = useInvalidateProjectDetailsQuery()

  const [loading, setLoading] = useState(false)

  // Determine if upgrade is in progress based on project status
  const isUpgradeInProgress = project?.status === PROJECT_STATUS.UPGRADING

  // Disk attributes for right-sizing check
  const planId = org?.plan.id ?? 'free'
  const { data: diskAttributes } = useDiskAttributesQuery({ projectRef: ref })
  const { includedDiskGB: includedDiskGBMeta } = PLAN_DETAILS[planId]
  const includedDiskGB = includedDiskGBMeta[diskAttributes?.attributes.type ?? 'gp3']
  const isDiskSizeUpdated = diskAttributes?.attributes.size_gb !== includedDiskGB

  // Eligibility data for pre-upgrade review
  const { data: eligibilityData } = useProjectUpgradeEligibilityQuery(
    { projectRef: ref },
    { enabled: !isUpgradeInProgress }
  )

  // Upgrade status for in-progress tracking
  const { data: upgradeStatusData } = useProjectUpgradingStatusQuery(
    {
      projectRef: ref,
      projectStatus: project?.status,
      trackingId: queryParams.get('trackingId'),
    },
    { enabled: IS_PLATFORM && isUpgradeInProgress }
  )

  const { initiated_at, status, progress, target_version, error } =
    upgradeStatusData?.databaseUpgradeStatus ?? {}

  // Derive the current upgrade state
  const upgradeState = deriveUpgradeState({
    isUpgradeInProgress,
    status,
    progress,
    targetVersion: target_version,
    error,
    initiatedAt: initiated_at,
  })

  // Get the target version for display
  const displayTargetVersion =
    target_version ||
    eligibilityData?.target_upgrade_versions?.[0]?.app_version?.split('supabase-postgres-')[1] ||
    ''

  const content = UPGRADE_STATE_CONTENT[upgradeState.status]

  const handleCancel = () => {
    router.push(`/project/${ref}/settings/infrastructure`)
  }

  const refetchProjectDetails = async () => {
    setLoading(true)
    if (ref) await invalidateProjectDetailsQuery(ref)
  }

  const sharedProps = {
    projectRef: ref ?? '',
    projectName: project?.name ?? '',
    displayTargetVersion,
  }

  return (
    <div className="max-w-3xl mx-auto my-16 px-6 lg:px-8 flex flex-col gap-y-10">
      {/* Header adapts based on upgrade state */}
      <header className="flex flex-col gap-y-4">
        <p className="text-xs uppercase font-mono text-foreground-lighter tracking-wider">
          {content.label}
        </p>
        <h1>{content.headline}</h1>
        <HeaderDescription
          upgradeState={upgradeState}
          projectName={project?.name ?? ''}
          displayTargetVersion={displayTargetVersion}
        />
      </header>

      {/* State-specific content */}
      {upgradeState.status === 'completed' && (
        <CompletedState
          {...sharedProps}
          targetVersion={upgradeState.targetVersion}
          onReturnToProject={refetchProjectDetails}
          isLoading={loading}
        />
      )}

      {upgradeState.status === 'failed' && (
        <FailedState
          {...sharedProps}
          error={upgradeState.error}
          initiatedAt={upgradeState.initiatedAt}
          targetVersion={upgradeState.targetVersion}
          onReturnToProject={refetchProjectDetails}
          isLoading={loading}
        />
      )}

      {upgradeState.status === 'upgrading' && (
        <UpgradingState
          {...sharedProps}
          progress={upgradeState.progress}
          isPerformingBackup={upgradeState.isPerformingBackup}
          initiatedAt={initiated_at}
        />
      )}

      {upgradeState.status === 'waiting' && (
        <WaitingState
          {...sharedProps}
          eligibilityData={eligibilityData}
          diskAttributes={diskAttributes}
          isDiskSizeUpdated={isDiskSizeUpdated}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}

interface HeaderDescriptionProps {
  upgradeState: ReturnType<typeof deriveUpgradeState>
  projectName: string
  displayTargetVersion: string | number
}

const HeaderDescription = ({
  upgradeState,
  projectName,
  displayTargetVersion,
}: HeaderDescriptionProps) => {
  switch (upgradeState.status) {
    case 'waiting':
      return (
        <p className="text-base text-foreground-light text-balance">
          Postgres version{' '}
          <strong className="text-foreground font-medium">{displayTargetVersion}</strong> is now
          available for the project{' '}
          <strong className="text-foreground font-medium">{projectName}</strong>. Supabase can
          upgrade your project to this version on your behalf. Here's what's involved.
        </p>
      )
    case 'upgrading':
      return (
        <p className="text-base text-foreground-light text-balance">
          Your project <strong className="text-foreground font-medium">{projectName}</strong> is
          being upgraded to Postgres{' '}
          <strong className="text-foreground font-medium">{displayTargetVersion}</strong>. This may
          take a few minutes to several hours depending on your database size.
        </p>
      )
    case 'completed':
      return (
        <p className="text-base text-foreground-light text-balance">
          Your project <strong className="text-foreground font-medium">{projectName}</strong> has
          been successfully upgraded to Postgres{' '}
          <strong className="text-foreground font-medium">{upgradeState.targetVersion}</strong>.
        </p>
      )
    case 'failed':
      return (
        <p className="text-base text-foreground-light text-balance">
          Something went wrong while upgrading{' '}
          <strong className="text-foreground font-medium">{projectName}</strong>. Your project is
          back online and your data is not affected.
        </p>
      )
  }
}
