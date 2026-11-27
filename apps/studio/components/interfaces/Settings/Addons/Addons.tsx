import { SupportCategories } from '@supabase/shared-types/out/constants'
import { Link } from '@tanstack/react-router'
import { useFlag, useParams } from 'common'
import {
  CpuIcon,
  GlobeIcon,
  HistoryIcon,
  LinkIcon,
  CopyIcon,
  HardDriveIcon,
  MessageSquareLockIcon,
  ScrollTextIcon,
  WorkflowIcon,
} from 'lucide-react'
import { ReactElement } from 'react'
import { Alert, AlertDescription, AlertTitle, Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection } from 'ui-patterns/PageSection'

import { AddonGroup, AddonRow } from './AddonRow'
import {
  countReadReplicas,
  DEFAULT_COMPUTE_SIZE,
  getActiveCountLabel,
  getAdvancedDiskDetail,
  getCustomDomainDisabledReason,
  getIPv4DisabledReason,
  getLowestPaidPrice,
  getPitrAlertState,
  getPitrDisabledReason,
  isAdvancedDiskEnabled,
  isComputeAddonEnabled,
  LOG_DRAIN_PRICE_LABEL,
  SMS_MFA_PRICE_LABEL,
} from './Addons.utils'
import CustomDomainSidePanel from './CustomDomainSidePanel'
import IPv4SidePanel from './IPv4SidePanel'
import PITRSidePanel from './PITRSidePanel'
import {
  getAddons,
  subscriptionHasHipaaAddon,
} from '@/components/interfaces/Billing/Subscription/Subscription.utils'
import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { HighAvailabilityDisabledSectionNotice } from '@/components/ui/HighAvailability/HighAvailabilityDisabledSectionNotice'
import { InlineLink } from '@/components/ui/InlineLink'
import { ResourceList } from '@/components/ui/Resource/ResourceList'
import { HorizontalShimmerWithIcon } from '@/components/ui/Shimmers'
import { UpgradeToPro } from '@/components/ui/UpgradeToPro'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useDiskAttributesQuery } from '@/data/config/disk-attributes-query'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useLogDrainsQuery } from '@/data/log-drains/log-drains-query'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useReplicationPipelinesQuery } from '@/data/replication/pipelines-query'
import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import {
  useIsAwsCloudProvider,
  useIsHighAvailability,
  useIsOrioleDbInAws,
  useIsProjectActive,
  useSelectedProjectQuery,
} from '@/hooks/misc/useSelectedProject'
import { getComputeCpuLabel, getComputeSizeLabel } from '@/lib/compute-labels'
import { DOCS_URL } from '@/lib/constants'
import { formatCurrency, getDatabaseMajorVersion, getSemanticVersion } from '@/lib/helpers'
import { useAddonsPagePanel } from '@/state/addons-page'

const docsLink = (path: string) => (
  <InlineLink className="text-foreground-light" href={`${DOCS_URL}${path}`}>
    Docs
  </InlineLink>
)

const PanelActionButton = ({
  label,
  disabledReason,
  onClick,
}: {
  label: string
  disabledReason?: string
  onClick: () => void
}) => (
  <ButtonTooltip
    size="tiny"
    disabled={!!disabledReason}
    onClick={onClick}
    tooltip={{ content: { side: 'bottom', text: disabledReason } }}
  >
    {label}
  </ButtonTooltip>
)

const FREE_PLAN_REASON = 'Upgrade to Pro to configure add-ons'

/** Link-style "Configure" button that renders as a disabled button when the add-on can't be configured */
const ConfigureLinkButton = ({
  isDisabled,
  children,
}: {
  isDisabled: boolean
  children: ReactElement
}) => {
  if (isDisabled) {
    return (
      <ButtonTooltip
        size="tiny"
        disabled
        tooltip={{ content: { side: 'bottom', text: FREE_PLAN_REASON } }}
      >
        Configure
      </ButtonTooltip>
    )
  }

  return (
    <Button asChild size="tiny">
      {children}
    </Button>
  )
}

export const Addons = () => {
  const { ref: projectRef } = useParams()
  const { setPanel } = useAddonsPagePanel()
  const isAws = useIsAwsCloudProvider()
  const isProjectActive = useIsProjectActive()
  const isOrioleDbInAws = useIsOrioleDbInAws() === true
  const isHighAvailability = useIsHighAvailability()

  const {
    projectSettingsCustomDomains,
    projectAddonsDedicatedIpv4Address,
    projectSettingsLogDrains,
    databaseReplication,
    infrastructureReadReplicas,
  } = useIsFeatureEnabled([
    'project_settings:custom_domains',
    'project_addons:dedicated_ipv4_address',
    'project_settings:log_drains',
    'database:replication',
    'infrastructure:read_replicas',
  ])

  const { data: selectedOrg } = useSelectedOrganizationQuery()
  const { data: selectedProject } = useSelectedProjectQuery()
  const isBranch = selectedProject?.parent_project_ref
  const isFreePlan = selectedOrg?.plan?.id === 'free'

  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: selectedOrg?.slug })

  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription) && settings?.is_sensitive === true

  // Only projects of version greater than supabase-postgrest-14.1.0.44 can use PITR
  const sufficientPgVersion =
    // introduced as generatedSemantic version could be < 141044 even if actual version is indeed past it
    // eg. 15.1.1.2 leads to 15112
    getDatabaseMajorVersion(selectedProject?.dbVersion ?? '') > 14 ||
    getSemanticVersion(selectedProject?.dbVersion ?? '') >= 141044

  const {
    data: addons,
    error,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useProjectAddonsQuery({ projectRef })

  const selectedAddons = addons?.selected_addons ?? []
  const { pitr, customDomain, ipv4, computeInstance } = getAddons(selectedAddons)

  // These add-ons are configured on their own pages, so we only read their state here
  const { data: logDrains, isPending: isLoadingLogDrains } = useLogDrainsQuery(
    { ref: projectRef },
    { enabled: projectSettingsLogDrains }
  )
  const { data: pipelinesData, isPending: isLoadingPipelines } = useReplicationPipelinesQuery(
    { projectRef },
    // No retries: a project without Pipelines set up errors, which should read as "Disabled"
    { enabled: databaseReplication, retry: false }
  )
  const { data: databases, isPending: isLoadingReplicas } = useReadReplicasQuery(
    { projectRef },
    { enabled: infrastructureReadReplicas }
  )
  const { data: diskData, isPending: isLoadingDisk } = useDiskAttributesQuery(
    { projectRef },
    { enabled: isAws }
  )
  const { data: authConfig, isPending: isLoadingAuthConfig } = useAuthConfigQuery({ projectRef })

  const advancedDiskEnabled = isAdvancedDiskEnabled(diskData?.attributes)
  const replicaCount = countReadReplicas(databases ?? [], projectRef)
  const logDrainCount = logDrains?.length ?? 0
  const pipelineCount = pipelinesData?.pipelines.length ?? 0
  const computeSize = computeInstance?.variant.identifier
  const computeEnabled = isComputeAddonEnabled(computeSize)
  const availableAddons = addons?.available_addons ?? []
  const lowestIpv4Price = getLowestPaidPrice(availableAddons, 'ipv4')
  const lowestCustomDomainPrice = getLowestPaidPrice(availableAddons, 'custom_domain')
  const lowestPitrPrice = getLowestPaidPrice(availableAddons, 'pitr')
  const lowestComputePrice = getLowestPaidPrice(availableAddons, 'compute_instance', [
    DEFAULT_COMPUTE_SIZE,
  ])
  const computeMeta = availableAddons
    .find((addon) => addon.type === 'compute_instance')
    ?.variants.find((variant) => variant.identifier === computeSize)?.meta
  const computeDetail = computeEnabled
    ? [
        computeSize ? getComputeCpuLabel(computeSize, computeMeta?.cpu_cores) : undefined,
        computeMeta?.memory_gb ? `${computeMeta.memory_gb} GB` : undefined,
      ]
        .filter(Boolean)
        .join(' · ')
    : `from ${formatCurrency(lowestComputePrice)} / month`
  const smsMfaEnabled =
    authConfig?.MFA_PHONE_ENROLL_ENABLED === true || authConfig?.MFA_PHONE_VERIFY_ENABLED === true

  const canUpdateIPv4 = settings?.db_ip_addr_config === 'ipv6'

  const ipv4Enabled = ipv4 !== undefined
  const pitrEnabled = pitr !== undefined
  const customDomainEnabled = customDomain !== undefined

  const canOpenIPv4 =
    isAws &&
    isProjectActive &&
    !projectUpdateDisabled &&
    (canUpdateIPv4 || ipv4Enabled) &&
    !isHighAvailability
  // HIPAA projects must have 28-day PITR. Once enabled it is locked; until then it can be enabled.
  const hasHipaaCompliantPitr = pitr?.variant.identifier === 'pitr_28'
  const isPitrLockedByHipaa = hasHipaaAddon && hasHipaaCompliantPitr
  const canOpenPITR =
    isProjectActive &&
    !projectUpdateDisabled &&
    sufficientPgVersion &&
    !isPitrLockedByHipaa &&
    !isOrioleDbInAws &&
    !isHighAvailability
  const canOpenCustomDomain = isProjectActive && !projectUpdateDisabled && !isHighAvailability

  const ipv4DisabledReason = getIPv4DisabledReason({
    isAws,
    isProjectActive,
    projectUpdateDisabled,
    canUpdateIPv4,
    ipv4Enabled,
    isHighAvailability,
  })

  const pitrDisabledReason = getPitrDisabledReason({
    isProjectActive,
    projectUpdateDisabled,
    hasHipaaAddon: isPitrLockedByHipaa,
    sufficientPgVersion,
    isOrioleDbInAws,
    isHighAvailability,
  })

  const customDomainDisabledReason = getCustomDomainDisabledReason({
    isProjectActive,
    projectUpdateDisabled,
    isHighAvailability,
  })
  const pitrAlertState = getPitrAlertState({
    hasHipaaAddon,
    hasHipaaCompliantPitr,
    sufficientPgVersion,
    isOrioleDbInAws,
  })

  const getDisabledReason = (reason?: string) => (isFreePlan ? FREE_PLAN_REASON : reason)

  const listTopSpacing = isBranch ? 'mt-6' : undefined

  let pitrAlert = null

  if (pitrAlertState === 'hipaa') {
    pitrAlert = (
      <Alert className="rounded-none border-0 border-b px-6">
        <AlertTitle>PITR cannot be changed with HIPAA</AlertTitle>
        <AlertDescription>
          All projects should have PITR enabled by default and cannot be changed with HIPAA enabled.
        </AlertDescription>
      </Alert>
    )
  } else if (pitrAlertState === 'hipaa-non-compliant') {
    pitrAlert = (
      <Alert variant="warning" className="rounded-none border-0 border-b px-6">
        <AlertTitle>Project is not HIPAA compliant</AlertTitle>
        <AlertDescription>
          Projects with HIPAA enabled must have 28 days of PITR. Enable the 28-day PITR add-on to
          make this project compliant.
        </AlertDescription>
        <div className="mt-4">
          <Button onClick={() => setPanel('pitr')} disabled={!canOpenPITR}>
            Enable 28-day PITR
          </Button>
        </div>
      </Alert>
    )
  } else if (pitrAlertState === 'legacy-project') {
    pitrAlert = (
      <Alert className="rounded-none border-0 border-b px-6">
        <AlertTitle>Your project is too old to enable PITR</AlertTitle>
        <AlertDescription>
          <p className="text-sm leading-normal mb-2">
            Reach out to us via support if you're interested
          </p>
          <Button asChild>
            <SupportLink
              queryParams={{
                projectRef,
                category: SupportCategories.SALES_ENQUIRY,
                subject: 'Project too old old for PITR',
              }}
            >
              Contact support
            </SupportLink>
          </Button>
        </AlertDescription>
      </Alert>
    )
  } else if (pitrAlertState === 'orioledb') {
    pitrAlert = (
      <Alert className="rounded-none border-0 border-b px-6">
        <AlertTitle>PITR not supported</AlertTitle>
        <AlertDescription>Point in time recovery is not supported with OrioleDB</AlertDescription>
      </Alert>
    )
  }

  return (
    <PageContainer size="default">
      <PageSection className="gap-0 pb-16">
        {isFreePlan && (
          <UpgradeToPro
            className="mb-6"
            primaryText="Upgrade to Pro to use add-ons"
            secondaryText="Add-ons aren't available on the Free plan. Upgrade to configure compute, backups, networking and more."
            source="addons"
          />
        )}
        {!isFreePlan && (
          <Admonition type="default" className="mb-6" title="Billed by the hour">
            Add-ons are charged with your plan at the end of each billing cycle. Remove one and you
            stop paying for it.
          </Admonition>
        )}
        <HighAvailabilityDisabledSectionNotice
          className="mb-4"
          title="Add-ons unavailable on High Availability projects"
          description="We're working to bring add-ons to High Availability projects. Contact support if this is blocking your work."
        />
        {isBranch && (
          <Admonition
            type="default"
            className="mb-4"
            title="You are currently on a preview branch of your project"
          >
            Updating add-ons here will only apply to this preview branch. To manage add-ons for your
            main branch, please visit the{' '}
            <InlineLink href={`/project/${selectedProject.parent_project_ref}/settings/addons`}>
              main branch
            </InlineLink>
            .
          </Admonition>
        )}

        {isLoading && (
          <ResourceList className={listTopSpacing}>
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
              >
                <div className="shimmering-loader size-8 shrink-0 rounded-lg" />
                <div className="flex-1">
                  <HorizontalShimmerWithIcon />
                </div>
              </div>
            ))}
          </ResourceList>
        )}

        {isError && <AlertError error={error} subject="Failed to retrieve project add-ons" />}

        {isSuccess && (
          <div className={listTopSpacing}>
            {(projectAddonsDedicatedIpv4Address || projectSettingsCustomDomains) && (
              <AddonGroup label="Networking">
                <ResourceList>
                  {projectAddonsDedicatedIpv4Address && (
                    <AddonRow
                      icon={<GlobeIcon size={16} strokeWidth={1.5} />}
                      title="Dedicated IPv4 address"
                      description="Reserve a dedicated IPv4 address for your project."
                      descriptionAction={docsLink('/guides/platform/ipv4-address')}
                      isEnabled={ipv4Enabled}
                      status={ipv4Enabled ? 'Enabled' : 'Disabled'}
                      detail={`${ipv4Enabled ? '' : 'from '}${formatCurrency(
                        ipv4Enabled ? ipv4.variant.price : lowestIpv4Price
                      )} / month`}
                      action={
                        <PanelActionButton
                          label="Configure"
                          disabledReason={getDisabledReason(
                            canOpenIPv4 ? undefined : ipv4DisabledReason
                          )}
                          onClick={() => setPanel('ipv4')}
                        />
                      }
                    />
                  )}
                  {projectSettingsCustomDomains && (
                    <AddonRow
                      icon={<LinkIcon size={16} strokeWidth={1.5} />}
                      title="Custom domain"
                      description="Serve your project on your own domain name."
                      descriptionAction={docsLink('/guides/platform/custom-domains')}
                      isEnabled={customDomainEnabled}
                      status={customDomainEnabled ? 'Enabled' : 'Disabled'}
                      detail={`${formatCurrency(
                        customDomainEnabled ? customDomain.variant.price : lowestCustomDomainPrice
                      )} / month`}
                      action={
                        <PanelActionButton
                          label="Configure"
                          disabledReason={getDisabledReason(
                            canOpenCustomDomain ? undefined : customDomainDisabledReason
                          )}
                          onClick={() => setPanel('customDomain')}
                        />
                      }
                    />
                  )}
                </ResourceList>
              </AddonGroup>
            )}

            <AddonGroup label="Database">
              <ResourceList>
                <AddonRow
                  icon={<CpuIcon size={16} strokeWidth={1.5} />}
                  title="Compute size"
                  description="Choose the CPU and memory available to your database."
                  descriptionAction={docsLink('/guides/platform/compute-and-disk')}
                  isEnabled={computeEnabled}
                  status={
                    computeEnabled ? (getComputeSizeLabel(computeSize) ?? 'Enabled') : 'Disabled'
                  }
                  detail={computeDetail}
                  action={
                    <ConfigureLinkButton isDisabled={isFreePlan}>
                      <Link
                        to="/project/$ref/settings/infrastructure"
                        params={{ ref: projectRef ?? '' }}
                        hash="compute"
                      >
                        Configure
                      </Link>
                    </ConfigureLinkButton>
                  }
                />
                {infrastructureReadReplicas && (
                  <AddonRow
                    icon={<CopyIcon size={16} strokeWidth={1.5} />}
                    title="Read replicas"
                    description="Deploy read-only copies of your database across regions."
                    descriptionAction={docsLink('/guides/platform/read-replicas')}
                    isEnabled={replicaCount > 0}
                    status={
                      isLoadingReplicas
                        ? undefined
                        : replicaCount > 0
                          ? getActiveCountLabel(replicaCount)
                          : 'Disabled'
                    }
                    detail="Billed per replica"
                    action={
                      <ConfigureLinkButton isDisabled={isFreePlan}>
                        <Link
                          to="/project/$ref/settings/infrastructure"
                          params={{ ref: projectRef ?? '' }}
                          hash="read-replicas"
                        >
                          Configure
                        </Link>
                      </ConfigureLinkButton>
                    }
                  />
                )}
                <AddonRow
                  icon={<HistoryIcon size={16} strokeWidth={1.5} />}
                  title="Point in time recovery"
                  description="Restore your database to a specific moment in the past."
                  descriptionAction={docsLink('/guides/platform/backups#point-in-time-recovery')}
                  isEnabled={pitrEnabled}
                  status={pitrEnabled ? 'Enabled' : 'Disabled'}
                  detail={
                    pitrEnabled
                      ? `${formatCurrency(pitr.variant.price)} / month`
                      : `from ${formatCurrency(lowestPitrPrice)} / month`
                  }
                  action={
                    <PanelActionButton
                      label="Configure"
                      disabledReason={getDisabledReason(
                        canOpenPITR ? undefined : pitrDisabledReason
                      )}
                      onClick={() => setPanel('pitr')}
                    />
                  }
                />
                {pitrAlert}
                {isAws && (
                  <AddonRow
                    icon={<HardDriveIcon size={16} strokeWidth={1.5} />}
                    title="Advanced Disk"
                    description="Provision IOPS and throughput, or configure a high-performance disk."
                    descriptionAction={docsLink('/guides/platform/compute-and-disk#disk')}
                    isEnabled={advancedDiskEnabled}
                    status={
                      isLoadingDisk ? undefined : advancedDiskEnabled ? 'Enabled' : 'Disabled'
                    }
                    detail={getAdvancedDiskDetail(diskData?.attributes)}
                    action={
                      <ConfigureLinkButton isDisabled={isFreePlan}>
                        <Link
                          to="/project/$ref/settings/infrastructure"
                          params={{ ref: projectRef ?? '' }}
                          hash="advanced"
                        >
                          Configure
                        </Link>
                      </ConfigureLinkButton>
                    }
                  />
                )}
                {databaseReplication && (
                  <AddonRow
                    icon={<WorkflowIcon size={16} strokeWidth={1.5} />}
                    title="Pipelines"
                    description="Replicate database changes to external destinations."
                    descriptionAction={docsLink('/guides/database/replication/pipelines')}
                    isEnabled={pipelineCount > 0}
                    status={
                      isLoadingPipelines
                        ? undefined
                        : pipelineCount > 0
                          ? getActiveCountLabel(pipelineCount)
                          : 'Disabled'
                    }
                    detail="Usage based"
                    action={
                      <ConfigureLinkButton isDisabled={isFreePlan}>
                        <Link
                          to="/project/$ref/database/pipelines"
                          params={{ ref: projectRef ?? '' }}
                        >
                          Configure
                        </Link>
                      </ConfigureLinkButton>
                    }
                  />
                )}
              </ResourceList>
            </AddonGroup>

            {projectSettingsLogDrains && (
              <AddonGroup label="Observability">
                <ResourceList>
                  <AddonRow
                    icon={<ScrollTextIcon size={16} strokeWidth={1.5} />}
                    title="Log drains"
                    description="Send your project logs to external destinations."
                    descriptionAction={docsLink('/guides/telemetry/log-drains')}
                    isEnabled={logDrainCount > 0}
                    status={
                      isLoadingLogDrains
                        ? undefined
                        : logDrainCount > 0
                          ? getActiveCountLabel(logDrainCount)
                          : 'Disabled'
                    }
                    detail={LOG_DRAIN_PRICE_LABEL}
                    action={
                      <ConfigureLinkButton isDisabled={isFreePlan}>
                        <Link
                          to="/project/$ref/settings/log-drains"
                          params={{ ref: projectRef ?? '' }}
                        >
                          Configure
                        </Link>
                      </ConfigureLinkButton>
                    }
                  />
                </ResourceList>
              </AddonGroup>
            )}

            <AddonGroup label="Auth">
              <ResourceList>
                <AddonRow
                  icon={<MessageSquareLockIcon size={16} strokeWidth={1.5} />}
                  title="Advanced Multi-Factor Auth - SMS"
                  description="Let users verify sign-ins with a code sent by SMS."
                  descriptionAction={docsLink('/guides/auth/auth-mfa/phone')}
                  isEnabled={smsMfaEnabled}
                  status={isLoadingAuthConfig ? undefined : smsMfaEnabled ? 'Enabled' : 'Disabled'}
                  detail={SMS_MFA_PRICE_LABEL}
                  action={
                    <ConfigureLinkButton isDisabled={isFreePlan}>
                      <Link
                        to="/project/$ref/auth/mfa"
                        params={{ ref: projectRef ?? '' }}
                        hash="sms-mfa"
                      >
                        Configure
                      </Link>
                    </ConfigureLinkButton>
                  }
                />
              </ResourceList>
            </AddonGroup>
          </div>
        )}

        {!isHighAvailability && (
          <>
            <PITRSidePanel />
            <CustomDomainSidePanel />
            <IPv4SidePanel />
          </>
        )}
      </PageSection>
    </PageContainer>
  )
}
