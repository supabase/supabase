import { useParams } from 'common'
import { useState } from 'react'

import { ProjectClaimChooseOrg } from 'components/interfaces/Organization/ProjectClaim/choose-org'
import { ProjectClaimConfirm } from 'components/interfaces/Organization/ProjectClaim/confirm'
import { ProjectClaimIntro } from 'components/interfaces/Organization/ProjectClaim/intro'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { ApiAuthorizationResponse } from 'data/api-authorization/api-authorization-query'
import { useOrganizationProjectClaimQuery } from 'data/organizations/organization-project-claim-query'
import { Alert } from 'ui'

export const ProjectClaim = ({ requester }: { requester: ApiAuthorizationResponse }) => {
  const { token: claimToken } = useParams()
  const [selectedOrgSlug, setSelectedOrgSlug] = useState<string>()
  const [step, setStep] = useState<'choose-org' | 'intro' | 'confirm'>('choose-org')

  const {
    data: projectClaim,
    error: errorProjectClaim,
    isError,
    isLoading,
  } = useOrganizationProjectClaimQuery(
    {
      slug: selectedOrgSlug!,
      token: claimToken!,
    },
    {
      enabled: !!claimToken && !!selectedOrgSlug,
    }
  )

  if (step === 'choose-org') {
    return (
      <ProjectClaimChooseOrg
        onChoose={(org) => {
          setSelectedOrgSlug(org.slug)
          setStep('intro')
        }}
      />
    )
  }

  if (isLoading) {
    return (
      <FormPanel header={<p>Authorize API access</p>}>
        <div className="px-8 py-6 space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      </FormPanel>
    )
  }

  if (isError) {
    return (
      <FormPanel header={<p>Authorize API access</p>}>
        <div className="px-8 py-6">
          <Alert
            withIcon
            variant="warning"
            title="Failed to fetch details for API authorization request"
          >
            <p>Please retry your authorization request from the requesting app</p>
            {errorProjectClaim !== undefined && (
              <p className="mt-2">Error: {errorProjectClaim?.message}</p>
            )}
          </Alert>
        </div>
      </FormPanel>
    )
  }

  if (step === 'intro') {
    return (
      <ProjectClaimIntro
        projectClaim={projectClaim}
        requester={requester}
        onContinue={() => setStep('confirm')}
      />
    )
  }

  return (
    <ProjectClaimConfirm
      organizationSlug={selectedOrgSlug!}
      projectClaim={projectClaim}
      requester={requester}
    />
  )
}
