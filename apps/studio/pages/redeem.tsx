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
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Loading } from 'ui'

const RedeemCredistPage: NextPageWithLayout = () => {
  const {
    query: { code },
  } = useRouter()

  const {
    data: organizations,
    isLoading: areOrganizationsLoading,
    isFetched: isOrganizationsFetched,
    isSuccess: wasOrganizationsRequestSuccessful,
  } = useOrganizationsQuery()

  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)

  const renderContent = () => {
    if (!isOrganizationsFetched) {
      return (
        <Loading active={areOrganizationsLoading}>
          <span>loading</span>
        </Loading>
      )
    }

    if (!wasOrganizationsRequestSuccessful) {
      return <p className="mt-4">Error loading redeem credit page. Try again later.</p>
    }

    return (
      <div>
        {organizations.map((org) => (
          <div key={org.id} onClickCapture={() => setSelectedOrg(org.slug)}>
            <OrganizationCard key={org.id} isLink={false} organization={org} />
          </div>
        ))}

        {selectedOrg && <CreditCodeRedemption slug={selectedOrg} modalVisible={true} />}
      </div>
    )
  }

  return (
    <ScaffoldContainer>
      <ScaffoldHeader>
        <ScaffoldTitle>Code Redemption</ScaffoldTitle>
      </ScaffoldHeader>
      <ScaffoldDivider />
      {renderContent()}
    </ScaffoldContainer>
  )
}

RedeemCredistPage.getLayout = (page) => <RedeemCreditsLayout>{page}</RedeemCreditsLayout>

export default RedeemCredistPage
