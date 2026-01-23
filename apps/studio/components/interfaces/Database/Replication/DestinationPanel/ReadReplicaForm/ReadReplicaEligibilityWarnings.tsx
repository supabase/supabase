import { SupportCategories } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { DocsButton } from 'components/ui/DocsButton'
import { UpgradePlanButton } from 'components/ui/UpgradePlanButton'
import { useEnablePhysicalBackupsMutation } from 'data/database/enable-physical-backups-mutation'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { MAX_REPLICAS_ABOVE_XL, MAX_REPLICAS_BELOW_XL } from 'data/read-replicas/replicas-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'
import { useCheckEligibilityDeployReplica } from './useCheckEligibilityDeployReplica'

export const ReadReplicaEligibilityWarnings = () => {
  const { ref: projectRef } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { data: project } = useSelectedProjectQuery()

  const [refetchInterval, setRefetchInterval] = useState<number | false>(false)

  const {
    hasOverdueInvoices,
    isAWSProvider,
    isAwsK8s,
    isPgVersionBelow15,
    isBelowSmallCompute,
    isWalgNotEnabled,
    isProWithSpendCapEnabled,
    isReachedMaxReplicas,
    maxNumberOfReplicas,
  } = useCheckEligibilityDeployReplica()

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

  if (hasOverdueInvoices) {
    return (
      <Admonition type="warning" title="Your organization has overdue invoices">
        <p>Please resolve all outstanding invoices first before deploying a new read replica</p>
        <Button asChild type="default" className="mt-2">
          <Link href={`/org/${org?.slug}/billing#invoices`}>View invoices</Link>
        </Button>
      </Admonition>
    )
  }

  if (!isAWSProvider) {
    return (
      <Admonition
        type="warning"
        title="Read replicas are only supported for projects provisioned via AWS"
      >
        <p>
          Projects provisioned by other cloud providers currently will not be able to use read
          replicas
        </p>
        <DocsButton
          abbrev={false}
          className="mt-2"
          href={`${DOCS_URL}/guides/platform/read-replicas#prerequisites`}
        />
      </Admonition>
    )
  }

  if (isAwsK8s) {
    return (
      <Admonition
        type="warning"
        title="Read replicas are not supported for AWS (Revamped) projects"
        description="Projects provisioned by other cloud providers currently will not be able to use read replicas"
      />
    )
  }

  if (isPgVersionBelow15) {
    return (
      <Admonition
        type="warning"
        title="Read replicas can only be deployed with projects on Postgres version 15 and above"
      >
        <p>If you'd like to use read replicas, please contact us via support</p>
        <Button asChild type="default" className="mt-2">
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
      </Admonition>
    )
  }

  if (isBelowSmallCompute) {
    return (
      <Admonition type="warning" title="Project required to at least be on a Small compute">
        <p>
          This is to ensure that read replicas can keep up with the primary databases' activities.
        </p>
        <div className="flex items-center gap-x-2 mt-2">
          <UpgradePlanButton
            variant="default"
            plan="Pro"
            addon="computeSize"
            source="read-replicas"
            featureProposition="deploy Read Replicas"
          >
            Change compute size
          </UpgradePlanButton>
          <DocsButton href={`${DOCS_URL}/guides/platform/read-replicas#prerequisites`} />
        </div>
      </Admonition>
    )
  }

  if (isWalgNotEnabled) {
    return (
      <Admonition
        type="warning"
        title={
          refetchInterval === false
            ? 'Physical backups are required to deploy replicas'
            : 'Physical backups are currently being enabled'
        }
      >
        {refetchInterval === false ? (
          <>
            <p>
              Physical backups are used under the hood to spin up read replicas for your project.
            </p>
            <p>
              Enabling physical backups will take a few minutes, after which you will be able to
              deploy read replicas.
            </p>
          </>
        ) : (
          <>
            <p>
              This warning will go away once physical backups have been enabled - check back in a
              few minutes!
            </p>
            <p>You may start deploying read replicas thereafter once this is completed.</p>
          </>
        )}
        {refetchInterval === false && (
          <div className="flex items-center gap-x-2 mt-2">
            <Button
              type="default"
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
        )}
      </Admonition>
    )
  }

  if (isProWithSpendCapEnabled) {
    return (
      <Admonition type="warning" title="Spend cap needs to be disabled to deploy replicas">
        <p>
          Launching a replica incurs additional disk size that will exceed the plan's quota. Disable
          the spend cap first to allow overages before launching a replica.
        </p>
        <UpgradePlanButton
          variant="default"
          source="read-replicas"
          addon="spendCap"
          className="mt-2"
        />
      </Admonition>
    )
  }

  if (isReachedMaxReplicas) {
    return (
      <Admonition
        type="warning"
        title={`You can only deploy up to ${maxNumberOfReplicas} read replicas at once`}
      >
        <p>If you'd like to spin up another read replica, please drop an existing replica first.</p>
        {maxNumberOfReplicas === MAX_REPLICAS_BELOW_XL && (
          <>
            <p>
              Alternatively, you may deploy up to{' '}
              <span className="text-foreground">{MAX_REPLICAS_ABOVE_XL}</span> replicas if your
              project is on an XL compute or higher.
            </p>
            <UpgradePlanButton
              variant="default"
              plan="Pro"
              addon="computeSize"
              source="read-replicas"
              featureProposition="deploy Read Replicas"
              className="mt-2"
            >
              Change compute size
            </UpgradePlanButton>
          </>
        )}
      </Admonition>
    )
  }
}
