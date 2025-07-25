import { useParams } from 'common'
import { ProjectClaimBenefits } from 'components/interfaces/Organization/ProjectClaim/benefits'
import { ProjectClaimChooseOrg } from 'components/interfaces/Organization/ProjectClaim/choose-org'
import { ProjectClaimConfirm } from 'components/interfaces/Organization/ProjectClaim/confirm'
import { ProjectClaimLayout } from 'components/interfaces/Organization/ProjectClaim/layout'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useApiAuthorizationQuery } from 'data/api-authorization/api-authorization-query'
import { useOrganizationProjectClaimQuery } from 'data/organizations/organization-project-claim-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { withAuth } from 'hooks/misc/withAuth'
import Head from 'next/head'
import { useMemo, useState } from 'react'
import type { NextPageWithLayout } from 'types'
import { Alert } from 'ui'

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
      <ProjectClaimLayout title="Claim a project">
        <div className="py-6 space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      </ProjectClaimLayout>
    )
  }

  if ((selectedOrgSlug && claimToken && isErrorProjectClaim) || isErrorRequester) {
    return (
      <ProjectClaimLayout title="Claim a project">
        <div className="py-6">
          <Alert
            withIcon
            variant="warning"
            title="Failed to retrieve project claim request details"
          >
            <p>Please retry your claim request from the requesting app</p>
            {errorProjectClaim != undefined && (
              <p className="mt-2">Error: {errorProjectClaim?.message}</p>
            )}
            {errorRequester != undefined && (
              <p className="mt-2">Error: {errorRequester?.message}</p>
            )}
            <p>Please go back to the requesting app and try again.</p>
          </Alert>
        </div>
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
  <>
    <Head>
      <title>Claim project | Supabase</title>
    </Head>
    <main className="flex-grow flex flex-col w-full h-full overflow-y-auto">{page}</main>
  </>
)

export default withAuth(ClaimProjectPage)
