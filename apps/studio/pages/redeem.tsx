import { useFlag } from 'common'
import Link from 'next/link'
import { useState } from 'react'
import { Button, Loading } from 'ui'
import { Admonition, ShimmeringLoader } from 'ui-patterns'

import { CreditCodeRedemption } from '@/components/interfaces/Organization/BillingSettings/CreditCodeRedemption'
import { OrganizationCard } from '@/components/interfaces/Organization/OrganizationCard'
import RedeemCreditsLayout from '@/components/layouts/RedeemCreditsLayout'
import {
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldHeader,
  ScaffoldTitle,
} from '@/components/layouts/Scaffold'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import type { NextPageWithLayout } from '@/types'

const RedeemCreditsContent = () => {
  const redeemCodeEnabled = useFlag('redeemCodeEnabled')
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)

  const {
    data: organizations,
    isLoading: areOrganizationsLoading,
    isFetched: isOrganizationsFetched,
    isSuccess: wasOrganizationsRequestSuccessful,
  } = useOrganizationsQuery()

  if (!isOrganizationsFetched) {
    return (
      <Loading active={areOrganizationsLoading}>
        <div className="grid md:grid-cols-2 pt-10 gap-8">
          <ShimmeringLoader className="w-full" />

          <div className="space-y-4">
            <ShimmeringLoader className="w-full h-14" />
            <ShimmeringLoader className="w-full h-14" />
          </div>
        </div>
      </Loading>
    )
  }

  if (!wasOrganizationsRequestSuccessful) {
    return <p className="mt-4">Error loading redeem credit page. Try again later.</p>
  }

  return (
    <div className="grid md:grid-cols-2 pt-10 gap-8">
      <div className="flex flex-col gap-y-8">
        <div className="flex flex-col gap-y-1">
          <p>To redeem your credits, select one of your organizations.</p>
          <p className="text-sm text-foreground-light text-balance">
            The credits will be applied to that organization only and cannot be transferred or
            shared between organizations.
          </p>
        </div>

        <div>
          <p>Want to start fresh?</p>
          <p className="mt-1 text-sm text-foreground-light text-balance">
            Create a new organization first. You will have to revisit this link after creating the
            organization to redeem the code.
          </p>
          <Button asChild className="mt-4 w-min" size="tiny" type="primary">
            <Link href={`/new`}>Create organization</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-y-2">
        {redeemCodeEnabled ? (
          organizations?.map((org) => (
            <OrganizationCard
              key={org.id}
              isLink={false}
              organization={org}
              onClick={() => setSelectedOrg(org.slug)}
            />
          ))
        ) : (
          <Admonition type="note" title="Code redemption coming soon" />
        )}
      </div>

      {selectedOrg && (
        <CreditCodeRedemption
          modalVisible
          slug={selectedOrg}
          onClose={() => setSelectedOrg(null)}
        />
      )}
    </div>
  )
}

const RedeemCreditsPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <ScaffoldHeader>
        <ScaffoldTitle>Code Redemption</ScaffoldTitle>
      </ScaffoldHeader>
      <ScaffoldDivider />
      <RedeemCreditsContent />
    </ScaffoldContainer>
  )
}

RedeemCreditsPage.getLayout = (page) => <RedeemCreditsLayout>{page}</RedeemCreditsLayout>

export default RedeemCreditsPage
