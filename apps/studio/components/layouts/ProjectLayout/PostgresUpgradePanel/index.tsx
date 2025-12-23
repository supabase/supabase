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
import { useEffect, useMemo, useState } from 'react'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { CompletedState, FailedState, UpgradingState, WaitingState } from './states'
import { deriveUpgradeState, UPGRADE_STATE_CONTENT, UpgradeTargetVersion } from './types'

const formatValue = (version: UpgradeTargetVersion) => {
  return `${version.postgres_version}|${version.release_channel}`
}

const getVersionDisplayString = (version: UpgradeTargetVersion | undefined) => {
  return version?.app_version?.split('supabase-postgres-')[1] ?? ''
}

export const PostgresUpgradePanel = () => {
  const router = useRouter()
  const { ref } = useParams()
  const queryParams = useSearchParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const { invalidateProjectDetailsQuery } = useInvalidateProjectDetailsQuery()

  const [loading, setLoading] = useState(false)
  const [selectedVersionValue, setSelectedVersionValue] = useState('')

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

  const targetVersions = useMemo(
    () => (eligibilityData?.target_upgrade_versions ?? []) as UpgradeTargetVersion[],
    [eligibilityData?.target_upgrade_versions]
  )

  // Initialize selected version when eligibility data loads
  useEffect(() => {
    if (targetVersions.length > 0 && !selectedVersionValue) {
      setSelectedVersionValue(formatValue(targetVersions[0]))
    }
  }, [targetVersions, selectedVersionValue])

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

  // Get the target version for display - use upgrade status if available, otherwise use selected version
  const displayTargetVersion = (() => {
    // If upgrading/completed/failed, use the target version from the upgrade status
    // Look up the full version string from eligibility data by matching postgres_version
    if (target_version) {
      const matchingVersion = targetVersions.find(
        (v) => v.postgres_version === String(target_version)
      )
      if (matchingVersion) {
        return getVersionDisplayString(matchingVersion)
      }
      // Fallback to string conversion if no match found (shouldn't happen in practice)
      return String(target_version)
    }

    // Otherwise, derive from the selected version in the form
    const selectedVersion = targetVersions.find((v) => formatValue(v) === selectedVersionValue)
    return getVersionDisplayString(selectedVersion) || getVersionDisplayString(targetVersions[0])
  })()

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
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <p className="text-xs uppercase font-mono text-foreground-lighter tracking-wider">
              {content.label}
            </p>
            <PageHeaderTitle>{content.headline}</PageHeaderTitle>
            <PageHeaderDescription className="text-balance">
              <UpgradePanelHeaderDescription
                upgradeState={upgradeState}
                projectName={project?.name ?? ''}
                displayTargetVersion={displayTargetVersion}
              />
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="small">
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
            selectedVersionValue={selectedVersionValue}
            onVersionChange={setSelectedVersionValue}
            onCancel={handleCancel}
          />
        )}
      </PageContainer>
    </>
  )
}

interface UpgradePanelHeaderDescriptionProps {
  upgradeState: ReturnType<typeof deriveUpgradeState>
  projectName: string
  displayTargetVersion: string | number
}

const UpgradePanelHeaderDescription = ({
  upgradeState,
  projectName,
  displayTargetVersion,
}: UpgradePanelHeaderDescriptionProps) => {
  switch (upgradeState.status) {
    case 'waiting':
      return (
        <p>
          Postgres version{' '}
          <strong className="text-foreground font-medium">{displayTargetVersion}</strong> is now
          available for your project{' '}
          <strong className="text-foreground font-medium">{projectName}</strong>. Supabase can
          upgrade your project to this version on your behalf. Here’s what’s involved.
        </p>
      )
    case 'upgrading':
      return (
        <p>
          Your project <strong className="text-foreground font-medium">{projectName}</strong> is
          being upgraded to Postgres{' '}
          <strong className="text-foreground font-medium">{displayTargetVersion}</strong>. This may
          take a few minutes to several hours depending on your database size.
        </p>
      )
    case 'completed':
      return (
        <p>
          Your project <strong className="text-foreground font-medium">{projectName}</strong> has
          been upgraded to Postgres{' '}
          <strong className="text-foreground font-medium">{displayTargetVersion}</strong>, and is
          now back online.
        </p>
      )
    case 'failed':
      return (
        <p>
          Something went wrong while upgrading{' '}
          <strong className="text-foreground font-medium">{projectName}</strong>. Your project is
          back online and your data is not affected.
        </p>
      )
  }
}
