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
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { BackingUpState, CompletedState, FailedState, UpgradingState, WaitingState } from './states'
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

  // DEBUG: remove after testing (keep for now)
  console.log('[PostgresUpgradePanel]', { upgradeState, status, progress, isUpgradeInProgress })

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

  // Return users to the infrastructure page via button click on upgrade cancellation, failure, and success
  const returnPath = `/project/${ref}/settings/infrastructure`

  const handleCancel = () => {
    router.push(returnPath)
  }

  const refetchProjectDetails = async () => {
    setLoading(true)
    try {
      if (ref) await invalidateProjectDetailsQuery(ref)
      router.push(`/project/${ref}/settings/infrastructure`)
    } finally {
      setLoading(false)
    }
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
              <HeightTransitionWrapper>
                <UpgradePanelHeaderDescription
                  upgradeState={upgradeState}
                  projectName={project?.name ?? ''}
                  displayTargetVersion={displayTargetVersion}
                />
              </HeightTransitionWrapper>
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
            initiatedAt={initiated_at}
          />
        )}

        {upgradeState.status === 'backingUp' && (
          <BackingUpState {...sharedProps} initiatedAt={initiated_at} />
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

interface HeightTransitionWrapperProps {
  children: ReactNode
}
// Helps to avoid layout shifts when content changes by animating the height of the changing content
const HeightTransitionWrapper = ({ children }: HeightTransitionWrapperProps) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>('auto')

  useEffect(() => {
    if (contentRef.current) {
      // Set initial height immediately
      setHeight(contentRef.current.scrollHeight)

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setHeight(entry.contentRect.height)
        }
      })

      resizeObserver.observe(contentRef.current)

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [children])

  return (
    <div
      className="overflow-hidden transition-[height] duration-300 ease-in-out"
      style={{ height: typeof height === 'number' ? `${height}px` : 'auto' }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
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
        <p className="text-foreground-light">
          Postgres version{' '}
          <strong className="text-foreground font-medium">{displayTargetVersion}</strong> is now
          available for the project{' '}
          <strong className="text-foreground font-medium">{projectName}</strong>. Supabase can
          upgrade your project to this version on your behalf. Here’s what’s involved.
        </p>
      )
    case 'upgrading':
      return (
        <p className="text-foreground-light">
          Your project <strong className="text-foreground font-medium">{projectName}</strong> is
          being upgraded to Postgres{' '}
          <strong className="text-foreground font-medium">{displayTargetVersion}</strong>. This may
          take a few minutes to several hours depending on the size of your database.
        </p>
      )
    case 'backingUp':
      return (
        <>
          <p className="text-foreground-light">
            Your project <strong className="text-foreground font-medium">{projectName}</strong> has
            been upgraded to Postgres{' '}
            <strong className="text-foreground font-medium">{displayTargetVersion}</strong>, and is
            back online.
          </p>
          <p className="text-foreground-light">
            A full backup is now being performed to ensure that there is a proper base backup
            available post-upgrade. This can take from a few minutes up to several hours depending
            on the size of your database.
          </p>
        </>
      )
    case 'completed':
      return (
        <p className="text-foreground-light">
          Your project <strong className="text-foreground font-medium">{projectName}</strong> has
          been upgraded to Postgres{' '}
          <strong className="text-foreground font-medium">{displayTargetVersion}</strong>, and is
          now back online.
        </p>
      )
    case 'failed':
      return (
        <p className="text-foreground-light">
          Something went wrong while upgrading{' '}
          <strong className="text-foreground font-medium">{projectName}</strong>. Your project is
          <strong className="text-foreground font-medium">back online</strong> and your{' '}
          <strong className="text-foreground font-medium">data is not affected.</strong> Please
          reach out to us via our support form for assistance with the upgrade.
        </p>
      )
  }
}
