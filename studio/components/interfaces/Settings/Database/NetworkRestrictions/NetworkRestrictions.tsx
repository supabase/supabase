import Link from 'next/link'
import { useState } from 'react'
import { Button, IconAlertCircle, IconExternalLink, IconGlobe, IconLock } from 'ui'

import { useParams } from 'hooks'
import Panel from 'components/ui/Panel'
import { FormPanel, FormHeader } from 'components/ui/Forms'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import AddRestrictionModal from './AddRestrictionModal'
import RemoveRestrictionModal from './RemoveRestrictionModal'
import DisallowAllModal from './DisallowAllModal'
import AllowAllModal from './AllowAllModal'
import { useNetworkRestrictionsQuery } from 'data/network-restrictions/network-restrictions-query'

const NetworkRestrictions = ({}) => {
  const { ref } = useParams()

  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [isAllowingAll, setIsAllowingAll] = useState(false)
  const [isDisallowingAll, setIsDisallowingAll] = useState(false)
  const [selectedRestrictionToRemove, setSelectedRestrictionToRemove] = useState<string>()
  const { data, isLoading } = useNetworkRestrictionsQuery({ projectRef: ref })

  const hasAccessToRestrictions = data?.entitlement === 'allowed'
  const restrictedIps = data?.config.dbAllowedCidrs ?? []
  const restrictionStatus = data?.status ?? ''

  const hasApplyError = restrictedIps.length === 0 && restrictionStatus === 'stored'
  const isUninitialized = restrictedIps.length === 0 && restrictionStatus.length === 0
  const isAllowedAll = restrictedIps.includes('0.0.0.0/0')
  const isDisallowedAll = restrictedIps.length === 1 && restrictedIps[0] === '127.0.0.1/32'

  if (!hasAccessToRestrictions) return <></>

  return (
    <>
      <section>
        <div className="flex items-center justify-between">
          <FormHeader
            title="Network Restrictions"
            description="Allow specific IP ranges to have access to your database."
          />
          <div className="flex items-center space-x-2">
            <Link href="https://supabase.com/docs/guides/platform/network-restrictions">
              <a target="_blank">
                <Button type="default" icon={<IconExternalLink />}>
                  Documentation
                </Button>
              </a>
            </Link>
            <Button onClick={() => setIsAddingAddress(true)}>Add restriction</Button>
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
                    <IconAlertCircle strokeWidth={1.5} className="text-scale-1000" />
                    <p className="text-sm">Your network restrictions were not applied correctly</p>
                  </div>
                  <p className="text-sm text-scale-1000">
                    Please try to add your network restrictions again
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button type="default" onClick={() => setIsAllowingAll(true)}>
                    Allow all access
                  </Button>
                  <Button type="default" onClick={() => setIsDisallowingAll(true)}>
                    Restrict all access
                  </Button>
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
                    <p className="text-scale-1100 text-sm">
                      Your database can be accessed by all IP addresses
                    </p>
                    <p className="text-scale-1000 text-sm">
                      You may start limiting access to your database by adding a network
                      restriction.
                    </p>
                  </div>
                </div>
                <div>
                  <Button type="default" onClick={() => setIsDisallowingAll(true)}>
                    Restrict all access
                  </Button>
                </div>
              </div>
            ) : isDisallowedAll ? (
              <div className="px-8 py-8 flex items-center justify-between">
                <div className="flex items-start space-x-4">
                  <IconLock className="text-scale-1100" strokeWidth={1.5} />
                  <div className="space-y-1">
                    <p className="text-scale-1100 text-sm">
                      Your database <span className="text-amber-900 opacity-80">cannot</span> be
                      accessed externally
                    </p>
                    <p className="text-scale-1000 text-sm">
                      All external IP addresses have been disallowed from accessing your project's
                      database.
                    </p>
                    <p className="text-scale-1000 text-sm">
                      Note: Restrictions only apply to your database, and not to Supabase services
                    </p>
                  </div>
                </div>
                <div>
                  <Button type="default" onClick={() => setIsAllowingAll(true)}>
                    Allow all access
                  </Button>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                <div className="px-8 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-scale-1100 text-sm">
                      Only the following IP addresses have access to your database
                    </p>
                    <p className="text-scale-1000 text-sm">
                      You may remove all of them to allow all IP addresses to have access to your
                      database
                    </p>
                    <p className="text-scale-1000 text-sm">
                      Note: Restrictions only apply to your database, and not to Supabase services
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button type="default" onClick={() => setIsAllowingAll(true)}>
                      Allow all access
                    </Button>
                    <Button type="default" onClick={() => setIsDisallowingAll(true)}>
                      Restrict all access
                    </Button>
                  </div>
                </div>
                {restrictedIps.map((ip) => {
                  return (
                    <div key={ip} className="px-8 py-4 flex items-center justify-between">
                      <div className="flex items-center space-x-5">
                        <IconGlobe size={16} className="text-scale-1000" />
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
