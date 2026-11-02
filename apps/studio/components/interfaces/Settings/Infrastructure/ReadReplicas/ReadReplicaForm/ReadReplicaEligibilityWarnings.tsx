import { SupportCategories } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  RECOMMENDED_COMPUTE_FOR_READ_REPLICAS,
  type RecommendedComputeForReadReplicas,
} from '../recommendCompute'
import { useCheckEligibilityDeployReplica } from './useCheckEligibilityDeployReplica'
import { getServiceVersionsPath } from '@/components/interfaces/Settings/General/ServiceVersions/ServiceVersions.utils'
import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import { AlertError } from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { InlineLink } from '@/components/ui/InlineLink'
import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { useEnablePhysicalBackupsMutation } from '@/data/database/enable-physical-backups-mutation'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
import { READ_REPLICAS_MAX_COUNT } from '@/data/read-replicas/replicas-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'

type Blocker = { key: string; title: string; body: ReactNode }

interface ReadReplicaEligibilityWarningsProps {
  eligibility: ReturnType<typeof useCheckEligibilityDeployReplica>
  onRecommendCompute: (size: RecommendedComputeForReadReplicas) => void
}

export const ReadReplicaEligibilityWarnings = ({
  eligibility,
  onRecommendCompute,
}: ReadReplicaEligibilityWarningsProps) => {
  const { ref: projectRef } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { data: project } = useSelectedProjectQuery()
  const planId = org?.plan?.id
  const isFreePlan = planId === undefined || planId === 'free'

  const [refetchInterval, setRefetchInterval] = useState<number | false>(false)

  const {
    isLoading,
    isError,
    error,
    refetch,
    hasOverdueInvoices,
    isAWSProvider,
    isAwsK8s,
    isPgVersionBelow15,
    isBelowSmallCompute,
    isWalgNotEnabled,
    isProWithSpendCapEnabled,
    isHighAvailability,
    isReachedMaxReplicas,
    isCollationLineageCrossed,
    maxNumberOfReplicas,
  } = eligibility

  const { data: projectDetail, isSuccess: isProjectDetailSuccess } = useProjectDetailQuery(
    { ref: projectRef },
    {
      refetchInterval,
      refetchOnWindowFocus: false,
    }
  )

  const { mutate: enablePhysicalBackups, isPending: isEnabling } = useEnablePhysicalBackupsMutation(
    {
      onSuccess: () => {
        toast.success(
          'Physical backups are currently being enabled, please check back in a few minutes!'
        )
        setRefetchInterval(5000)
      },
    }
  )

  useEffect(() => {
    if (!isProjectDetailSuccess) return
    if (projectDetail.is_physical_backups_enabled) {
      setRefetchInterval(false)
    }
  }, [projectDetail?.is_physical_backups_enabled, isProjectDetailSuccess])

  if (isLoading) return <GenericSkeletonLoader className="p-5" />

  if (isError) {
    return (
      <AlertError
        projectRef={projectRef}
        subject="Failed to check read replica eligibility"
        error={error}
        additionalActions={
          <Button variant="default" onClick={() => refetch()}>
            Retry
          </Button>
        }
      />
    )
  }

  const blockers: Blocker[] = []

  if (hasOverdueInvoices) {
    blockers.push({
      key: 'overdue-invoices',
      title: 'Your organization has overdue invoices',
      body: (
        <>
          <p>Please resolve all outstanding invoices first before deploying a new read replica.</p>
          <Button asChild className="mt-2">
            <Link href={`/org/${org?.slug}/billing#invoices`}>View invoices</Link>
          </Button>
        </>
      ),
    })
  }

  if (isHighAvailability) {
    blockers.push({
      key: 'high-availability',
      title: 'Read replicas are unavailable for High Availability projects',
      body: (
        <p>
          We're working to bring this feature to High Availability projects. Contact support if this
          is blocking your work.
        </p>
      ),
    })
  }

  if (!isAWSProvider) {
    blockers.push({
      key: 'not-aws',
      title: 'Read replicas are only supported for projects provisioned via AWS',
      body: (
        <>
          <p>
            Projects provisioned by other cloud providers currently will not be able to use read
            replicas.
          </p>
          <DocsButton
            abbrev={false}
            className="mt-2"
            href={`${DOCS_URL}/guides/platform/read-replicas#prerequisites`}
          />
        </>
      ),
    })
  }

  if (isAwsK8s) {
    blockers.push({
      key: 'aws-k8s',
      title: 'Read replicas are not supported for AWS (Revamped) projects',
      body: (
        <p>
          Projects provisioned by other cloud providers currently will not be able to use read
          replicas.
        </p>
      ),
    })
  }

  if (isPgVersionBelow15) {
    blockers.push({
      key: 'pg-version',
      title: 'Read replicas can only be deployed with projects on Postgres version 15 and above',
      body: (
        <>
          <p>If you'd like to use read replicas, please contact us via support.</p>
          <Button asChild className="mt-2">
            <SupportLink
              queryParams={{
                projectRef,
                category: SupportCategories.SALES_ENQUIRY,
                subject: 'Enquiry on read replicas',
                message: `Project DB version: ${project?.dbVersion}`,
              }}
            >
              Contact support
            </SupportLink>
          </Button>
        </>
      ),
    })
  }

  if (isCollationLineageCrossed) {
    blockers.push({
      key: 'collation-lineage',
      title: 'Upgrade Postgres before creating a read replica',
      body: (
        <>
          <p>
            A replica created now would use newer collation libraries than your primary database,
            which can cause collation drift between them. You can create a read replica once you've
            upgraded Postgres.
          </p>
          <Button asChild className="mt-2">
            <Link href={getServiceVersionsPath(projectRef)}>Upgrade Postgres</Link>
          </Button>
        </>
      ),
    })
  }

  if (isBelowSmallCompute) {
    blockers.push({
      key: 'small-compute',
      title: 'Small compute required',
      body: (
        <>
          <p>
            Read replicas require at least Small compute to keep up with the primary database.{' '}
            <InlineLink href={`${DOCS_URL}/guides/platform/read-replicas#prerequisites`}>
              Learn more
            </InlineLink>
          </p>
          {isFreePlan ? (
            <UpgradePlanButton
              variant="default"
              plan="Pro"
              addon="computeSize"
              source="read-replicas"
              featureProposition="deploy Read Replicas"
              className="mt-2"
            />
          ) : (
            <Button
              className="mt-2"
              onClick={() => onRecommendCompute(RECOMMENDED_COMPUTE_FOR_READ_REPLICAS.minimum)}
            >
              Change compute
            </Button>
          )}
        </>
      ),
    })
  }

  if (isWalgNotEnabled) {
    const isEnablingBackups = refetchInterval !== false
    blockers.push({
      key: 'physical-backups',
      title: isEnablingBackups
        ? 'Physical backups are currently being enabled'
        : 'Physical backups are required to deploy replicas',
      body: isEnablingBackups ? (
        <>
          <p>
            This warning will go away once physical backups have been enabled - check back in a few
            minutes!
          </p>
          <p>You may start deploying read replicas thereafter once this is completed.</p>
        </>
      ) : (
        <>
          <p>Physical backups are used under the hood to spin up read replicas for your project.</p>
          <p>
            Enabling physical backups will take a few minutes, after which you will be able to
            deploy read replicas.
          </p>
          <div className="flex items-center gap-x-2 mt-2">
            <Button
              loading={isEnabling}
              disabled={isEnabling}
              onClick={() => {
                if (projectRef) enablePhysicalBackups({ ref: projectRef })
              }}
            >
              Enable physical backups
            </Button>
            <DocsButton
              abbrev={false}
              href={`${DOCS_URL}/guides/platform/read-replicas#how-are-read-replicas-made`}
            />
          </div>
        </>
      ),
    })
  }

  if (isProWithSpendCapEnabled) {
    blockers.push({
      key: 'spend-cap',
      title: 'Spend cap needs to be disabled to deploy replicas',
      body: (
        <>
          <p>
            Launching a replica incurs additional disk size that will exceed the plan's quota.
            Disable the spend cap first to allow overages before launching a replica.
          </p>
          <UpgradePlanButton
            variant="default"
            source="read-replicas"
            addon="spendCap"
            className="mt-2"
          >
            Disable spend cap
          </UpgradePlanButton>
        </>
      ),
    })
  }

  if (isReachedMaxReplicas) {
    blockers.push({
      key: 'max-replicas',
      title: `You can only deploy up to ${maxNumberOfReplicas} read replicas at once`,
      body: (
        <>
          <p>
            If you'd like to spin up another read replica, please drop an existing replica first.
          </p>
          {maxNumberOfReplicas < READ_REPLICAS_MAX_COUNT && (
            <>
              <p>
                Alternatively, you may deploy up to{' '}
                <span className="text-foreground">{READ_REPLICAS_MAX_COUNT}</span> replicas if your
                project is on an XL compute or higher.
              </p>
              <Button
                className="mt-2"
                onClick={() =>
                  onRecommendCompute(RECOMMENDED_COMPUTE_FOR_READ_REPLICAS.unlockMaxReplicas)
                }
              >
                Change to XL compute
              </Button>
            </>
          )}
        </>
      ),
    })
  }

  if (blockers.length === 0) return null

  if (blockers.length === 1) {
    const [{ title, body }] = blockers
    return (
      <Admonition type="warning" title={title}>
        {body}
      </Admonition>
    )
  }

  return (
    <Admonition type="warning" title="Read replicas can't be deployed yet">
      <div className="flex flex-col gap-y-4">
        {blockers.map(({ key, title, body }) => (
          <div key={key}>
            <p className="text-foreground">{title}</p>
            {body}
          </div>
        ))}
      </div>
    </Admonition>
  )
}
