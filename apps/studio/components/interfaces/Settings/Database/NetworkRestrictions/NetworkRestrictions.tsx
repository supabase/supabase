import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { AlertCircle, ChevronDown, Globe, Lock } from 'lucide-react'
import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import AddRestrictionModal from './AddRestrictionModal'
import AllowAllModal from './AllowAllModal'
import DisallowAllModal from './DisallowAllModal'
import RemoveRestrictionModal from './RemoveRestrictionModal'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DocsButton } from '@/components/ui/DocsButton'
import { HighAvailabilityDisabledSectionNotice } from '@/components/ui/HighAvailability/HighAvailabilityDisabledSectionNotice'
import { useNetworkRestrictionsQuery } from '@/data/network-restrictions/network-restrictions-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useHighAvailability } from '@/hooks/misc/useHighAvailability'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'

const HA_DISABLED_TITLE = 'Network restrictions unavailable on High Availability projects'
const HA_DISABLED_DESCRIPTION =
  "We're working to bring network restrictions to High Availability projects. Contact support if this is blocking your work."

interface AccessButtonProps {
  disabled: boolean
  disabledTooltip?: string
  onClick: (value: boolean) => void
}

const getDisabledTooltip = (disabled: boolean, disabledTooltip?: string) =>
  disabled ? disabledTooltip : undefined

const AllowAllAccessButton = ({ disabled, disabledTooltip, onClick }: AccessButtonProps) => (
  <ButtonTooltip
    variant="default"
    disabled={disabled}
    onClick={() => onClick(true)}
    tooltip={{
      content: {
        side: 'bottom',
        text: getDisabledTooltip(disabled, disabledTooltip),
      },
    }}
  >
    Allow all access
  </ButtonTooltip>
)

const DisallowAllAccessButton = ({ disabled, disabledTooltip, onClick }: AccessButtonProps) => (
  <ButtonTooltip
    disabled={disabled}
    variant="default"
    onClick={() => onClick(true)}
    tooltip={{
      content: {
        side: 'bottom',
        text: getDisabledTooltip(disabled, disabledTooltip),
      },
    }}
  >
    Restrict all access
  </ButtonTooltip>
)

export const NetworkRestrictions = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { isHighAvailability } = useHighAvailability()
  const [isAddingAddress, setIsAddingAddress] = useState<undefined | 'IPv4' | 'IPv6'>()
  const [isAllowingAll, setIsAllowingAll] = useState(false)
  const [isDisallowingAll, setIsDisallowingAll] = useState(false)
  const [selectedRestrictionToRemove, setSelectedRestrictionToRemove] = useState<string>()

  const { data, isPending: isLoading } = useNetworkRestrictionsQuery(
    { projectRef: ref },
    { enabled: Boolean(project) }
  )
  const { can: canUpdateNetworkRestrictions } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )

  const isSectionDisabled = isHighAvailability || !canUpdateNetworkRestrictions
  const sectionDisabledReason = isHighAvailability
    ? HA_DISABLED_TITLE
    : 'You need additional permissions to update network restrictions'

  const hasAccessToRestrictions = data?.entitlement === 'allowed'
  const ipv4Restrictions = data?.config?.dbAllowedCidrs ?? []
  // @ts-ignore [Joshen] API typing issue
  const ipv6Restrictions = data?.config?.dbAllowedCidrsV6 ?? []
  const restrictedIps = ipv4Restrictions.concat(ipv6Restrictions)
  const restrictionStatus = data?.status ?? ''

  const hasApplyError = restrictionStatus === 'stored'
  const isUninitialized = restrictedIps.length === 0 && restrictionStatus.length === 0
  const isAllowedAll = restrictedIps.includes('0.0.0.0/0') && restrictedIps.includes('::/0')
  const isDisallowedAll = restrictedIps.length === 0

  if (!hasAccessToRestrictions) return null

  return (
    <>
      <PageSection id="network-restrictions">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Network restrictions</PageSectionTitle>
          </PageSectionSummary>
          <PageSectionAside className="flex items-center gap-x-2">
            <DocsButton href={`${DOCS_URL}/guides/platform/network-restrictions`} />
            {!canUpdateNetworkRestrictions || isHighAvailability ? (
              <ButtonTooltip
                disabled
                variant="primary"
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: sectionDisabledReason,
                  },
                }}
              >
                Add restriction
              </ButtonTooltip>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="primary"
                    disabled={isSectionDisabled}
                    iconRight={<ChevronDown size={14} />}
                  >
                    Add restriction
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="bottom" className="w-48">
                  <DropdownMenuItem
                    key="IPv4"
                    disabled={isLoading}
                    onClick={() => setIsAddingAddress('IPv4')}
                  >
                    <p className="block text-foreground">Add IPv4 restriction</p>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    key="IPv6"
                    disabled={isLoading}
                    onClick={() => setIsAddingAddress('IPv6')}
                  >
                    <p className="block text-foreground">Add IPv6 restriction</p>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </PageSectionAside>
        </PageSectionMeta>
        <PageSectionContent>
          {isHighAvailability && (
            <div className="mb-4">
              <HighAvailabilityDisabledSectionNotice
                title={HA_DISABLED_TITLE}
                description={HA_DISABLED_DESCRIPTION}
              />
            </div>
          )}
          {!isHighAvailability &&
            (isLoading ? (
              <Card>
                <CardContent>
                  <div className="space-y-2">
                    <ShimmeringLoader />
                    <ShimmeringLoader className="w-[70%]" />
                    <ShimmeringLoader className="w-[50%]" />
                  </div>
                </CardContent>
              </Card>
            ) : hasApplyError ? (
              <Card>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <AlertCircle
                          size={20}
                          strokeWidth={1.5}
                          className="text-foreground-light"
                        />
                        <p className="text-sm">
                          Your network restrictions were not applied correctly
                        </p>
                      </div>
                      <p className="text-sm text-foreground-light">
                        Please try to add your network restrictions again
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AllowAllAccessButton
                        disabled={isSectionDisabled}
                        disabledTooltip={sectionDisabledReason}
                        onClick={setIsAllowingAll}
                      />
                      <DisallowAllAccessButton
                        disabled={isSectionDisabled}
                        disabledTooltip={sectionDisabledReason}
                        onClick={setIsDisallowingAll}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                {isUninitialized || isAllowedAll ? (
                  <CardContent className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="space-y-0.5">
                        <p className="text-foreground text-sm">
                          Your database can be accessed by all IP addresses
                        </p>
                        <p className="text-foreground-light text-sm">
                          You may start limiting access to your database by adding a network
                          restriction.
                        </p>
                      </div>
                    </div>
                    <div>
                      <DisallowAllAccessButton
                        disabled={isSectionDisabled}
                        disabledTooltip={sectionDisabledReason}
                        onClick={setIsDisallowingAll}
                      />
                    </div>
                  </CardContent>
                ) : isDisallowedAll ? (
                  <CardContent className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <Lock size={20} className="text-foreground-light" strokeWidth={1.5} />
                      <div className="space-y-1">
                        <p className="text-foreground-light text-sm">
                          Your database <span className="text-amber-900 opacity-80">cannot</span> be
                          accessed externally
                        </p>
                        <p className="text-foreground-light text-sm">
                          All external IP addresses have been disallowed from accessing your
                          project's database.
                        </p>
                        <p className="text-foreground-light text-sm">
                          Note: Restrictions only apply to your database, and not to Supabase
                          services
                        </p>
                      </div>
                    </div>
                    <div>
                      <AllowAllAccessButton
                        disabled={isSectionDisabled}
                        disabledTooltip={sectionDisabledReason}
                        onClick={setIsAllowingAll}
                      />
                    </div>
                  </CardContent>
                ) : (
                  <>
                    <CardHeader className="md:flex-row md:items-center justify-between">
                      <CardDescription className="text-foreground-light">
                        <p>Only the following IP addresses have access to your database.</p>
                        <p>
                          You may remove all of them to allow all IP addresses to have access to
                          your database.
                        </p>
                        <p>
                          Note: Restrictions only apply to your database, and not to Supabase
                          services
                        </p>
                      </CardDescription>
                      <div className="flex items-center space-x-2">
                        <AllowAllAccessButton
                          disabled={isSectionDisabled}
                          disabledTooltip={sectionDisabledReason}
                          onClick={setIsAllowingAll}
                        />
                        <DisallowAllAccessButton
                          disabled={isSectionDisabled}
                          disabledTooltip={sectionDisabledReason}
                          onClick={setIsDisallowingAll}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="py-0">
                      <div className="divide-y">
                        {restrictedIps.map((ip) => {
                          return (
                            <div key={ip} className="py-4 flex items-center justify-between">
                              <div className="flex items-center space-x-5">
                                <Globe size={16} className="text-foreground-lighter" />
                                <Badge>{ipv4Restrictions.includes(ip) ? 'IPv4' : 'IPv6'}</Badge>
                                <p className="text-sm font-mono">{ip}</p>
                              </div>
                              <ButtonTooltip
                                variant="default"
                                disabled={isSectionDisabled}
                                onClick={() => setSelectedRestrictionToRemove(ip)}
                                tooltip={{
                                  content: {
                                    side: 'bottom',
                                    text: getDisabledTooltip(
                                      isSectionDisabled,
                                      sectionDisabledReason
                                    ),
                                  },
                                }}
                              >
                                Remove
                              </ButtonTooltip>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            ))}
        </PageSectionContent>
      </PageSection>

      <AllowAllModal visible={isAllowingAll} onClose={() => setIsAllowingAll(false)} />
      <DisallowAllModal visible={isDisallowingAll} onClose={() => setIsDisallowingAll(false)} />

      <AddRestrictionModal
        type={isAddingAddress}
        hasOverachingRestriction={isAllowedAll || isDisallowedAll}
        onClose={() => setIsAddingAddress(undefined)}
      />
      <RemoveRestrictionModal
        visible={selectedRestrictionToRemove !== undefined}
        selectedRestriction={selectedRestrictionToRemove}
        onClose={() => setSelectedRestrictionToRemove(undefined)}
      />
    </>
  )
}
