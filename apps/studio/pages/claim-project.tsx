import Head from 'next/head'
import { PropsWithChildren, useMemo, useState } from 'react'

import { useParams } from 'common'
import { ProjectClaimBenefits } from 'components/interfaces/Organization/ProjectClaim/benefits'
import { ProjectClaimChooseOrg } from 'components/interfaces/Organization/ProjectClaim/choose-org'
import { ProjectClaimConfirm } from 'components/interfaces/Organization/ProjectClaim/confirm'
import { ProjectClaimLayout } from 'components/interfaces/Organization/ProjectClaim/layout'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useApiAuthorizationQuery } from 'data/api-authorization/api-authorization-query'
import { useOrganizationProjectClaimQuery } from 'data/organizations/organization-project-claim-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { withAuth } from 'hooks/misc/withAuth'
import type { NextPageWithLayout } from 'types'
import { Admonition } from 'ui-patterns'

const ClaimProjectPageLayout = ({ children }: PropsWithChildren) => {
  const { appTitle } = useCustomContent(['app:title'])

  return (
    <>
      <Head>
        <title>Claim project | {appTitle || 'Supabase'}</title>
      </Head>
      {children}
    </>
  )
}

const ClaimProjectPage: NextPageWithLayout = () => {
  const { auth_id, token: claimToken } = useParams()
  const [selectedOrgSlug, setSelectedOrgSlug] = useState<string>()
  const [step, setStep] = useState<'choose-org' | 'benefits' | 'confirm'>('choose-org')

  const {
    data: requester,
    isLoading: isLoadingRequester,
    isError: isErrorRequester,
    error: errorRequester,
  } = useApiAuthorizationQuery({ id: auth_id })
  const { data: organizations } = useOrganizationsQuery()

  const selectedOrganization = useMemo(() => {
    return (organizations || []).find((org) => org.slug === selectedOrgSlug)
  }, [selectedOrgSlug, organizations])

  const {
    data: projectClaim,
    error: errorProjectClaim,
    isError: isErrorProjectClaim,
    isLoading: isLoadingProjectClaim,
    isSuccess: isSuccessProjectClaim,
  } = useOrganizationProjectClaimQuery(
    {
      slug: selectedOrgSlug!,
      token: claimToken!,
    },
    {
      enabled: !!claimToken && !!selectedOrgSlug,
    }
  )

  if ((selectedOrgSlug && claimToken && isLoadingProjectClaim) || isLoadingRequester) {
    return (
      <ProjectClaimLayout title="Claim a project" className="py-6">
        <div className="space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      </ProjectClaimLayout>
    )
  }

  if ((selectedOrgSlug && claimToken && isErrorProjectClaim) || isErrorRequester) {
    return (
      <ProjectClaimLayout title="Claim a project" className="py-6">
        <Admonition
          type="warning"
          className="mb-0"
          title="Failed to retrieve project claim request details"
        >
          <p>Please retry your claim request from the requesting app</p>
          {!!errorProjectClaim && <p className="mt-2">Error: {errorProjectClaim?.message}</p>}
          {!!errorRequester && <p className="mt-2">Error: {errorRequester?.message}</p>}
        </Admonition>
      </ProjectClaimLayout>
    )
  }

  if (step === 'choose-org' || !selectedOrganization) {
    return (
      <ProjectClaimChooseOrg
        onChoose={(org) => {
          setSelectedOrgSlug(org.slug)
          setStep('benefits')
        }}
      />
    )
  }

  if (isSuccessProjectClaim) {
    if (step === 'benefits') {
      return (
        <ProjectClaimBenefits
          projectClaim={projectClaim}
          requester={requester}
          onContinue={() => setStep('confirm')}
        />
      )
    }

    return (
      <ProjectClaimConfirm
        setStep={setStep}
        selectedOrganization={selectedOrganization}
        projectClaim={projectClaim}
        requester={requester}
      />
    )
  }

  return null
}

ClaimProjectPage.getLayout = (page) => (
  <ClaimProjectPageLayout>
    <main className="flex flex-col w-full min-h-screen overflow-y-auto">{page}</main>
  </ClaimProjectPageLayout>
)

export default withAuth(ClaimProjectPage)
