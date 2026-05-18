import { SupportCategories } from '@supabase/shared-types/out/constants'
import { useFlag, useParams } from 'common'
import { Lock } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection } from 'ui-patterns/PageSection'

import {
  getCustomDomainDisabledReason,
  getIPv4DisabledReason,
  getPitrAlertState,
  getPitrDisabledReason,
} from './Addons.utils'
import CustomDomainSidePanel from './CustomDomainSidePanel'
import IPv4SidePanel from './IPv4SidePanel'
import PITRSidePanel from './PITRSidePanel'
import {
  getAddons,
  subscriptionHasHipaaAddon,
} from '@/components/interfaces/Billing/Subscription/Subscription.utils'
import { ProjectUpdateDisabledTooltip } from '@/components/interfaces/Organization/BillingSettings/ProjectUpdateDisabledTooltip'
import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import AlertError from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import { ResourceItem } from '@/components/ui/Resource/ResourceItem'
import { ResourceList } from '@/components/ui/Resource/ResourceList'
import { HorizontalShimmerWithIcon } from '@/components/ui/Shimmers'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import {
  useIsAwsCloudProvider,
  useIsOrioleDbInAws,
  useIsProjectActive,
  useSelectedProjectQuery,
} from '@/hooks/misc/useSelectedProject'
import { BASE_PATH, DOCS_URL } from '@/lib/constants'
import { getDatabaseMajorVersion, getSemanticVersion } from '@/lib/helpers'
import { useAddonsPagePanel } from '@/state/addons-page'

export const Addons = () => {
  const { resolvedTheme } = useTheme()
  const { ref: projectRef } = useParams()
  const { setPanel } = useAddonsPagePanel()
  const isAws = useIsAwsCloudProvider()
  const isProjectActive = useIsProjectActive()
  const isOrioleDbInAws = useIsOrioleDbInAws() === true

  const { projectSettingsCustomDomains, projectAddonsDedicatedIpv4Address } = useIsFeatureEnabled([
    'project_settings:custom_domains',
    'project_addons:dedicated_ipv4_address',
  ])

  const { data: selectedOrg } = useSelectedOrganizationQuery()
  const { data: selectedProject } = useSelectedProjectQuery()
  const isBranch = selectedProject?.parent_project_ref

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
  const { pitr, customDomain, ipv4 } = getAddons(selectedAddons)

  const canUpdateIPv4 = settings?.db_ip_addr_config === 'ipv6'

  const ipv4Enabled = ipv4 !== undefined
  const pitrEnabled = pitr !== undefined
  const customDomainEnabled = customDomain !== undefined

  const canOpenIPv4 =
    isAws && isProjectActive && !projectUpdateDisabled && (canUpdateIPv4 || ipv4Enabled)
  const canOpenPITR =
    isProjectActive &&
    !projectUpdateDisabled &&
    sufficientPgVersion &&
    !hasHipaaAddon &&
    !isOrioleDbInAws
  const canOpenCustomDomain = isProjectActive && !projectUpdateDisabled

  const ipv4DisabledReason = getIPv4DisabledReason({
    isAws,
    isProjectActive,
    projectUpdateDisabled,
    canUpdateIPv4,
    ipv4Enabled,
  })

  const pitrDisabledReason = getPitrDisabledReason({
    isProjectActive,
    projectUpdateDisabled,
    hasHipaaAddon,
    sufficientPgVersion,
    isOrioleDbInAws,
  })

  const customDomainDisabledReason = getCustomDomainDisabledReason({
    isProjectActive,
    projectUpdateDisabled,
  })
  const pitrAlertState = getPitrAlertState({
    hasHipaaAddon,
    sufficientPgVersion,
    isOrioleDbInAws,
  })

  const listTopSpacing = isBranch ? 'mt-6' : undefined
  const resourceItemClassName =
    'min-h-[128px] border-b! last:border-b-0! [&>div:first-child]:hidden @lg:[&>div:first-child]:flex'

  let pitrAlert = null

  if (pitrAlertState === 'hipaa') {
    pitrAlert = (
      <Alert className="rounded-none border-0 border-b px-6">
        <AlertTitle>PITR cannot be changed with HIPAA</AlertTitle>
        <AlertDescription>
          All projects should have PITR enabled by default and cannot be changed with HIPAA enabled.
          Contact support for further assistance.
        </AlertDescription>
        <div className="mt-4">
          <Button type="default" asChild>
            <SupportLink>Contact support</SupportLink>
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
          <Button asChild type="default">
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
      <PageSection className="last:pb-0 gap-0">
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
                className="flex min-h-[128px] items-center gap-4 border-b px-6 py-4 last:border-b-none"
              >
                <div className="hidden @lg:flex h-24 w-40 shrink-0 items-center justify-center rounded-lg border">
                  <div className="shimmering-loader h-full w-full rounded-lg" />
                </div>
                <div className="flex-1">
                  <HorizontalShimmerWithIcon />
                </div>
              </div>
            ))}
          </ResourceList>
        )}

        {isError && <AlertError error={error} subject="Failed to retrieve project add-ons" />}

        {isSuccess && (
          <ResourceList className={listTopSpacing}>
            {projectAddonsDedicatedIpv4Address && (
              <ResourceItem
                className={resourceItemClassName}
                onClick={canOpenIPv4 ? () => setPanel('ipv4') : undefined}
                media={
                  <Image
                    className="bg rounded-lg border"
                    alt="IPv4"
                    width={160}
                    height={96}
                    src={
                      ipv4Enabled
                        ? `${BASE_PATH}/img/ipv4-on${resolvedTheme?.includes('dark') ? '' : '--light'}.svg?v=2`
                        : `${BASE_PATH}/img/ipv4-off${resolvedTheme?.includes('dark') ? '' : '--light'}.svg?v=2`
                    }
                  />
                }
                meta={
                  <div className="flex items-center gap-4">
                    <ProjectUpdateDisabledTooltip
                      projectUpdateDisabled={projectUpdateDisabled}
                      projectNotActive={!isProjectActive}
                      tooltip={ipv4DisabledReason}
                    >
                      {ipv4Enabled ? (
                        <Badge variant="success">Enabled</Badge>
                      ) : (
                        <Badge variant="default">Disabled</Badge>
                      )}
                    </ProjectUpdateDisabledTooltip>
                  </div>
                }
              >
                <div className="space-y-1">
                  <div>Dedicated IPv4 address</div>
                  <p className="m-0 text-foreground-light text-sm">
                    Reserve a dedicated IPv4 address for your project.
                  </p>
                  <InlineLink
                    className="text-foreground-light"
                    href={`${DOCS_URL}/guides/platform/ipv4-address`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    About IPv4 deprecation
                  </InlineLink>
                </div>
              </ResourceItem>
            )}

            <ResourceItem
              className={resourceItemClassName}
              onClick={canOpenPITR ? () => setPanel('pitr') : undefined}
              media={
                <Image
                  className="bg rounded-lg border"
                  alt="PITR"
                  width={160}
                  height={96}
                  src={
                    pitrEnabled
                      ? `${BASE_PATH}/img/pitr-on${resolvedTheme?.includes('dark') ? '' : '--light'}.svg`
                      : `${BASE_PATH}/img/pitr-off${resolvedTheme?.includes('dark') ? '' : '--light'}.svg`
                  }
                />
              }
              meta={
                <div className="flex items-center gap-4">
                  {pitrEnabled ? (
                    <Badge variant="success">Enabled</Badge>
                  ) : (
                    <Badge variant="default">Disabled</Badge>
                  )}
                  {!canOpenPITR && pitrDisabledReason && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Lock strokeWidth={1.5} className="text-foreground-light" size={16} />
                      </TooltipTrigger>
                      <TooltipContent>{pitrDisabledReason}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              }
            >
              <div className="space-y-1">
                <div>Point in time recovery</div>
                <p className="m-0 text-foreground-light text-sm">
                  Restore your database to a specific moment in the past.
                </p>
                <InlineLink
                  href={`${DOCS_URL}/guides/platform/backups#point-in-time-recovery`}
                  className="text-foreground-light"
                  onClick={(e) => e.stopPropagation()}
                >
                  About PITR backups
                </InlineLink>
              </div>
            </ResourceItem>

            {pitrAlert}

            {projectSettingsCustomDomains && (
              <ResourceItem
                className={resourceItemClassName}
                onClick={canOpenCustomDomain ? () => setPanel('customDomain') : undefined}
                media={
                  <Image
                    className="bg rounded-lg border"
                    alt="Custom Domain"
                    width={160}
                    height={96}
                    src={
                      customDomainEnabled
                        ? `${BASE_PATH}/img/custom-domain-on${
                            resolvedTheme?.includes('dark') ? '' : '--light'
                          }.svg`
                        : `${BASE_PATH}/img/custom-domain-off${
                            resolvedTheme?.includes('dark') ? '' : '--light'
                          }.svg`
                    }
                  />
                }
                meta={
                  <div className="flex items-center gap-4">
                    {customDomainEnabled ? (
                      <Badge variant="success">Enabled</Badge>
                    ) : (
                      <Badge variant="default">Disabled</Badge>
                    )}
                    {!canOpenCustomDomain && customDomainDisabledReason && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Lock strokeWidth={1.5} className="text-foreground-light" size={16} />
                        </TooltipTrigger>
                        <TooltipContent>{customDomainDisabledReason}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                }
              >
                <div className="space-y-1">
                  <div>Custom domain</div>
                  <p className="m-0 text-foreground-light text-sm">
                    Serve your project on your own domain name.
                  </p>
                  <InlineLink
                    href={`${DOCS_URL}/guides/platform/custom-domains`}
                    className="text-foreground-light"
                    onClick={(e) => e.stopPropagation()}
                  >
                    About custom domains
                  </InlineLink>
                </div>
              </ResourceItem>
            )}
          </ResourceList>
        )}

        <PITRSidePanel />
        <CustomDomainSidePanel />
        <IPv4SidePanel />
      </PageSection>
    </PageContainer>
  )
}
