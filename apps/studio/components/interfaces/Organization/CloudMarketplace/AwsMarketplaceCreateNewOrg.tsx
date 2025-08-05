import { useAwsManagedOrganizationCreateMutation } from '../../../../data/organizations/organization-create-mutation'
import { toast } from 'sonner'
import { SubmitHandler } from 'react-hook-form'
import NewAwsMarketplaceOrgForm, {
  CREATE_AWS_MANAGED_ORG_FORM_ID,
  NewMarketplaceOrgForm,
} from './NewAwsMarketplaceOrgForm'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from '../../../layouts/Scaffold'
import Link from 'next/link'
import { Button } from 'ui'
import { useRouter } from 'next/router'
import AwsMarketplaceOrgCreationSuccess from './AwsMarketplaceOrgCreationSuccess'
import { useState } from 'react'
import AutoRenewalWarning from './AutoRenewalWarning'
import { CloudMarketplaceOnboardingInfo } from './cloud-marketplace-query'

interface Props {
  onboardingInfo?: CloudMarketplaceOnboardingInfo | undefined
}

const AwsMarketplaceCreateNewOrg = ({ onboardingInfo }: Props) => {
  const router = useRouter()
  const {
    query: { buyer_id: buyerId },
  } = router

  const { mutate: createOrganization, isLoading: isCreatingOrganization } =
    useAwsManagedOrganizationCreateMutation({
      onSuccess: (org) => {
        //TODO(thomas): send tracking event
        setOrgCreatedSuccessfully(true)
        setNewlyCreatedOrgSlug(org.slug)
      },
      onError: (res) => {
        toast.error(res.message, {
          duration: 7_000,
        })
      },
    })

  const onSubmit: SubmitHandler<NewMarketplaceOrgForm> = async (values) => {
    createOrganization({ ...values, buyerId: buyerId as string })
  }

  const [orgCreatedSuccessfully, setOrgCreatedSuccessfully] = useState(false)
  const [newlyCreatedOrgSlug, setNewlyCreatedOrgSlug] = useState('')

  return (
    <>
      {onboardingInfo && !onboardingInfo.aws_contract_auto_renewal && (
        <AutoRenewalWarning
          awsContractEndDate={onboardingInfo.aws_contract_end_date}
          awsContractSetupPageUrl={onboardingInfo.aws_contract_setup_page_url}
        />
      )}
      <ScaffoldSection>
        <ScaffoldSectionDetail>
          <p className="mb-6 text-base">
            You’ve subscribed to the Supabase {onboardingInfo?.plan_name_selected_on_marketplace}{' '}
            Plan via the AWS Marketplace. As a final step, you need to create a Supabase
            organization. That organization will be managed and billed through AWS Marketplace.
            <br />
            <br />
            You can read more on billing through AWS in our {''}
            <Link
              href="https://supabase.com/docs/guides/platform"
              target="_blank"
              className="underline"
            >
              docs.
            </Link>
          </p>
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent className="lg:ml-10">
          <div className="border-l px-10 pt-10">
            <NewAwsMarketplaceOrgForm onSubmit={onSubmit} />

            <div className="flex justify-end mt-10">
              <Button
                form={CREATE_AWS_MANAGED_ORG_FORM_ID}
                htmlType="submit"
                loading={isCreatingOrganization}
                size="medium"
              >
                Create organization
              </Button>
            </div>
          </div>
        </ScaffoldSectionContent>
      </ScaffoldSection>

      <AwsMarketplaceOrgCreationSuccess
        visible={orgCreatedSuccessfully}
        onClose={() => {
          router.push(`/org/${newlyCreatedOrgSlug}`)
        }}
      />
    </>
  )
}

export default AwsMarketplaceCreateNewOrg
