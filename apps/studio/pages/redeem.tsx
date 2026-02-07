import Link from 'next/link'
import { useState } from 'react'
import { Button, Loading } from 'ui'
import { ShimmeringLoader } from 'ui-patterns'

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
  const {
    data: organizations,
    isLoading: areOrganizationsLoading,
    isFetched: isOrganizationsFetched,
    isSuccess: wasOrganizationsRequestSuccessful,
  } = useOrganizationsQuery()

  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)

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
      <div>
        <p>
          To redeem your credits, select one of your organizations. The credits will be applied to
          that organization only and cannot be transferred or shared between organizations.
        </p>
        <p className="mt-8">
          <span className="font-bold text-foreground-light">Want to start fresh?</span> Create a new
          organization first. You will have to revisit this link after creating the organization to
          redeem the code.
        </p>
        <Button asChild className="mt-4" size="tiny" type="primary">
          <Link href={`/new`}>Create organization</Link>
        </Button>
      </div>

      <div className="space-y-2">
        {organizations?.map((org) => (
          <div key={org.id} onClickCapture={() => setSelectedOrg(org.slug)}>
            <OrganizationCard isLink={false} organization={org} />
          </div>
        ))}
      </div>

      {selectedOrg && (
        <CreditCodeRedemption
          slug={selectedOrg}
          modalVisible={true}
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
