import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import Link from 'next/link'
import { useState } from 'react'
import { Button, IconAlertCircle, IconExternalLink, IconGlobe, IconLock } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormHeader, FormPanel } from 'components/ui/Forms'
import Panel from 'components/ui/Panel'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useNetworkRestrictionsQuery } from 'data/network-restrictions/network-restrictions-query'
import { useCheckPermissions } from 'hooks'
import AddRestrictionModal from './AddRestrictionModal'
import AllowAllModal from './AllowAllModal'
import DisallowAllModal from './DisallowAllModal'
import RemoveRestrictionModal from './RemoveRestrictionModal'

interface AccessButtonProps {
  disabled: boolean
  onClick: (value: boolean) => void
}

const AllowAllAccessButton = ({ disabled, onClick }: AccessButtonProps) => (
  <Tooltip.Root delayDuration={0}>
    <Tooltip.Trigger>
      <Button type="default" disabled={disabled} onClick={() => onClick(true)}>
        Allow all access
      </Button>
    </Tooltip.Trigger>
    {disabled && (
      <Tooltip.Portal>
        <Tooltip.Content align="center" side="bottom">
          <Tooltip.Arrow className="radix-tooltip-arrow" />
          <div
            className={[
              'rounded bg-alternative py-1 px-2 leading-none shadow',
              'border border-background w-[250px]',
            ].join(' ')}
          >
            <span className="text-xs text-foreground">
              You need additional permissions to update network restrictions
            </span>
          </div>
        </Tooltip.Content>
      </Tooltip.Portal>
    )}
  </Tooltip.Root>
)

const DisallowAllAccessButton = ({ disabled, onClick }: AccessButtonProps) => (
  <Tooltip.Root delayDuration={0}>
    <Tooltip.Trigger>
      <Button type="default" disabled={disabled} onClick={() => onClick(true)}>
        Restrict all access
      </Button>
    </Tooltip.Trigger>
    {disabled && (
      <Tooltip.Portal>
        <Tooltip.Content align="center" side="bottom">
          <Tooltip.Arrow className="radix-tooltip-arrow" />
          <div
            className={[
              'rounded bg-alternative py-1 px-2 leading-none shadow',
              'border border-background w-[250px]',
            ].join(' ')}
          >
            <span className="text-xs text-foreground">
              You need additional permissions to update network restrictions
            </span>
          </div>
        </Tooltip.Content>
      </Tooltip.Portal>
    )}
  </Tooltip.Root>
)

const NetworkRestrictions = ({}) => {
  const { ref } = useParams()
  const { project } = useProjectContext()
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [isAllowingAll, setIsAllowingAll] = useState(false)
  const [isDisallowingAll, setIsDisallowingAll] = useState(false)
  const [selectedRestrictionToRemove, setSelectedRestrictionToRemove] = useState<string>()
  const { data, isLoading } = useNetworkRestrictionsQuery({ projectRef: ref })

  const canUpdateNetworkRestrictions = useCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

  const hasAccessToRestrictions = data?.entitlement === 'allowed'
  const restrictedIps = data?.config?.dbAllowedCidrs ?? []
  const restrictionStatus = data?.status ?? ''

  const hasApplyError = restrictedIps.length === 0 && restrictionStatus === 'stored'
  const isUninitialized = restrictedIps.length === 0 && restrictionStatus.length === 0
  const isAllowedAll = restrictedIps.includes('0.0.0.0/0')
  const isDisallowedAll = restrictedIps.length === 1 && restrictedIps[0] === '127.0.0.1/32'

  if (!hasAccessToRestrictions) return <></>

  return (
    <>
      <section id="network-restrictions">
        <div className="flex items-center justify-between">
          <FormHeader
            title="Network Restrictions"
            description="Allow specific IP ranges to have access to your database."
          />
          <div className="flex items-center space-x-2 mb-6">
            <Button asChild type="default" icon={<IconExternalLink />}>
              <Link
                href="https://supabase.com/docs/guides/platform/network-restrictions"
                target="_blank"
                rel="noreferrer"
              >
                Documentation
              </Link>
            </Button>
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <Button
                  disabled={!canUpdateNetworkRestrictions}
                  onClick={() => setIsAddingAddress(true)}
                >
                  Add restriction
                </Button>
              </Tooltip.Trigger>
              {!canUpdateNetworkRestrictions && (
                <Tooltip.Portal>
                  <Tooltip.Content align="center" side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-alternative py-1 px-2 leading-none shadow',
                        'border border-background w-[250px]',
                      ].join(' ')}
                    >
                      <span className="text-xs text-foreground">
                        You need additional permissions to update network restrictions
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          </div>
        </div>
        {isLoading ? (
          <Panel>
            <Panel.Content>
              <div className="space-y-2">
                <ShimmeringLoader />
                <ShimmeringLoader className="w-[70%]" />
                <ShimmeringLoader className="w-[50%]" />
              </div>
            </Panel.Content>
          </Panel>
        ) : hasApplyError ? (
          <Panel>
            <Panel.Content>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <IconAlertCircle strokeWidth={1.5} className="text-foreground-light" />
                    <p className="text-sm">Your network restrictions were not applied correctly</p>
                  </div>
                  <p className="text-sm text-foreground-light">
                    Please try to add your network restrictions again
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <AllowAllAccessButton
                    disabled={!canUpdateNetworkRestrictions}
                    onClick={setIsAllowingAll}
                  />
                  <DisallowAllAccessButton
                    disabled={!canUpdateNetworkRestrictions}
                    onClick={setIsDisallowingAll}
                  />
                </div>
              </div>
            </Panel.Content>
          </Panel>
        ) : (
          <FormPanel>
            {isUninitialized || isAllowedAll ? (
              <div className="px-8 py-8 flex items-center justify-between">
                <div className="flex items-start space-x-4">
                  <div className="space-y-1">
                    <p className="text-foreground-light text-sm">
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
                    disabled={!canUpdateNetworkRestrictions}
                    onClick={setIsDisallowingAll}
                  />
                </div>
              </div>
            ) : isDisallowedAll ? (
              <div className="px-8 py-8 flex items-center justify-between">
                <div className="flex items-start space-x-4">
                  <IconLock className="text-foreground-light" strokeWidth={1.5} />
                  <div className="space-y-1">
                    <p className="text-foreground-light text-sm">
                      Your database <span className="text-amber-900 opacity-80">cannot</span> be
                      accessed externally
                    </p>
                    <p className="text-foreground-light text-sm">
                      All external IP addresses have been disallowed from accessing your project's
                      database.
                    </p>
                    <p className="text-foreground-light text-sm">
                      Note: Restrictions only apply to your database, and not to Supabase services
                    </p>
                  </div>
                </div>
                <div>
                  <AllowAllAccessButton
                    disabled={!canUpdateNetworkRestrictions}
                    onClick={setIsAllowingAll}
                  />
                </div>
              </div>
            ) : (
              <div className="divide-y">
                <div className="px-8 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-foreground-light text-sm">
                      Only the following IP addresses have access to your database
                    </p>
                    <p className="text-foreground-light text-sm">
                      You may remove all of them to allow all IP addresses to have access to your
                      database
                    </p>
                    <p className="text-foreground-light text-sm">
                      Note: Restrictions only apply to your database, and not to Supabase services
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AllowAllAccessButton
                      disabled={!canUpdateNetworkRestrictions}
                      onClick={setIsAllowingAll}
                    />
                    <DisallowAllAccessButton
                      disabled={!canUpdateNetworkRestrictions}
                      onClick={setIsDisallowingAll}
                    />
                  </div>
                </div>
                {restrictedIps.map((ip) => {
                  return (
                    <div key={ip} className="px-8 py-4 flex items-center justify-between">
                      <div className="flex items-center space-x-5">
                        <IconGlobe size={16} className="text-foreground-light" />
                        <p className="text-sm font-mono">{ip}</p>
                      </div>
                      <Button type="default" onClick={() => setSelectedRestrictionToRemove(ip)}>
                        Remove
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </FormPanel>
        )}
      </section>

      <AllowAllModal visible={isAllowingAll} onClose={() => setIsAllowingAll(false)} />
      <DisallowAllModal visible={isDisallowingAll} onClose={() => setIsDisallowingAll(false)} />

      <AddRestrictionModal
        visible={isAddingAddress}
        restrictedIps={restrictedIps}
        hasOverachingRestriction={isAllowedAll || isDisallowedAll}
        onClose={() => setIsAddingAddress(false)}
      />
      <RemoveRestrictionModal
        visible={selectedRestrictionToRemove !== undefined}
        restrictedIps={restrictedIps}
        selectedRestriction={selectedRestrictionToRemove}
        onClose={() => setSelectedRestrictionToRemove(undefined)}
      />
    </>
  )
}

export default NetworkRestrictions
