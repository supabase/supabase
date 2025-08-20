import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronDown, Globe, Lock, Unlock } from 'lucide-react'
import { useState } from 'react'

import { useParams } from 'common'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import { useNetworkRestrictionsQuery } from 'data/network-restrictions/network-restrictions-query'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  ScaffoldSection,
  ScaffoldSectionTitle,
  ScaffoldSectionDescription,
} from 'components/layouts/Scaffold'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import AddRestrictionModal from './AddRestrictionModal'
import AllowAllModal from './AllowAllModal'
import DisallowAllModal from './DisallowAllModal'
import RemoveRestrictionModal from './RemoveRestrictionModal'

interface AccessButtonProps {
  disabled: boolean
  onClick: (value: boolean) => void
}

const AllowAllAccessButton = ({ disabled, onClick }: AccessButtonProps) => (
  <ButtonTooltip
    type="default"
    disabled={disabled}
    onClick={() => onClick(true)}
    tooltip={{
      content: {
        side: 'bottom',
        text: disabled
          ? 'You need additional permissions to update network restrictions'
          : undefined,
      },
    }}
  >
    Allow all access
  </ButtonTooltip>
)

const DisallowAllAccessButton = ({ disabled, onClick }: AccessButtonProps) => (
  <ButtonTooltip
    type="default"
    disabled={disabled}
    onClick={() => onClick(true)}
    tooltip={{
      content: {
        side: 'bottom',
        text: disabled
          ? 'You need additional permissions to update network restrictions'
          : undefined,
      },
    }}
  >
    Restrict all access
  </ButtonTooltip>
)

export const NetworkRestrictions = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [isAddingAddress, setIsAddingAddress] = useState<undefined | 'IPv4' | 'IPv6'>()
  const [isAllowingAll, setIsAllowingAll] = useState(false)
  const [isDisallowingAll, setIsDisallowingAll] = useState(false)
  const [selectedRestrictionToRemove, setSelectedRestrictionToRemove] = useState<string>()

  const { data, isLoading } = useNetworkRestrictionsQuery({ projectRef: ref })
  const { can: canUpdateNetworkRestrictions } = useAsyncCheckProjectPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )

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
      <ScaffoldSection id="network-restrictions" className="gap-6">
        <ScaffoldSectionTitle className="flex items-center justify-between  gap-2">
          <div className="flex flex-col gap-1">
            Network Restrictions
            <ScaffoldSectionDescription>
              Allow specific IP ranges to have access to your database.
            </ScaffoldSectionDescription>
          </div>

          <DocsButton href="https://supabase.com/docs/guides/platform/network-restrictions" />

          {!canUpdateNetworkRestrictions ? (
            <ButtonTooltip
              disabled
              type="primary"
              tooltip={{
                content: {
                  side: 'bottom',
                  text: 'You need additional permissions to update network restrictions',
                },
              }}
            >
              Add restriction
            </ButtonTooltip>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="primary"
                  disabled={!canUpdateNetworkRestrictions}
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
        </ScaffoldSectionTitle>

        {isLoading ? (
          <Card>
            <CardContent>
              <GenericSkeletonLoader />
            </CardContent>
          </Card>
        ) : hasApplyError ? (
          <Admonition type="warning" title="Your network restrictions were not applied correctly">
            <p>Please try to add your network restrictions again</p>
            <div className="flex gap-2">
              <AllowAllAccessButton
                disabled={!canUpdateNetworkRestrictions}
                onClick={setIsAllowingAll}
              />
              <DisallowAllAccessButton
                disabled={!canUpdateNetworkRestrictions}
                onClick={setIsDisallowingAll}
              />
            </div>
          </Admonition>
        ) : isUninitialized || isAllowedAll ? (
          <Card>
            <CardContent className="flex gap-4">
              <Unlock />
              <FormLayout
                layout="flex-row-reverse"
                label="Any IP address can access your database"
                description="You may start limiting access to your database by adding a network restriction."
              >
                <DisallowAllAccessButton
                  disabled={!canUpdateNetworkRestrictions}
                  onClick={setIsDisallowingAll}
                />
              </FormLayout>
            </CardContent>
          </Card>
        ) : isDisallowedAll ? (
          <Card>
            <CardContent className="flex gap-4">
              <Lock />
              <FormLayout
                layout="flex-row-reverse"
                label={
                  <>
                    Your database <span className="text-amber-900 opacity-80">cannot</span> be
                    accessed externally
                  </>
                }
                description={
                  <div className="space-y-1 xl:max-w-lg">
                    <p>
                      All external IP addresses have been disallowed from accessing your project's
                      database.
                    </p>
                    <p>
                      Note: Restrictions only apply to your database, and not to Supabase services
                    </p>
                  </div>
                }
              >
                <AllowAllAccessButton
                  disabled={!canUpdateNetworkRestrictions}
                  onClick={setIsAllowingAll}
                />
              </FormLayout>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>Only the following IP addresses have access to your database</CardHeader>
            {restrictedIps.map((ip) => {
              return (
                <CardContent className="flex items-center justify-between gap-4">
                  <Globe size={16} className="text-foreground-light" />
                  <div className="w-full flex items-center gap-4">
                    <Badge>{ipv4Restrictions.includes(ip) ? 'IPv4' : 'IPv6'}</Badge>
                    <p className="text-sm font-mono">{ip}</p>
                  </div>
                  <Button type="default" onClick={() => setSelectedRestrictionToRemove(ip)}>
                    Remove
                  </Button>
                </CardContent>
              )
            })}
            <CardContent className="text-sm text-foreground-light space-y-1">
              <p>
                You may remove all of them to allow all IP addresses to have access to your database
              </p>
              <p>Note: Restrictions only apply to your database, and not to Supabase services</p>
            </CardContent>
            <CardFooter className="justify-end">
              <AllowAllAccessButton
                disabled={!canUpdateNetworkRestrictions}
                onClick={setIsAllowingAll}
              />
              <DisallowAllAccessButton
                disabled={!canUpdateNetworkRestrictions}
                onClick={setIsDisallowingAll}
              />
            </CardFooter>
          </Card>
        )}
      </ScaffoldSection>

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
