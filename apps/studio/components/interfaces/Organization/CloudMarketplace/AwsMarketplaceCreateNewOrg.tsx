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
import AwsMarketplaceAutoRenewalWarning from './AwsMarketplaceAutoRenewalWarning'
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
        //TODO(thomas): send tracking event?
        router.push(`/org/${org.slug}`)
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

  return (
    <>
      {onboardingInfo && !onboardingInfo.aws_contract_auto_renewal && (
        <AwsMarketplaceAutoRenewalWarning
          awsContractEndDate={onboardingInfo.aws_contract_end_date}
          awsContractSettingsUrl={onboardingInfo.aws_contract_settings_url}
        />
      )}
      <ScaffoldSection>
        <ScaffoldSectionDetail className="text-base">
          <p>
            You’ve subscribed to the Supabase {onboardingInfo?.plan_name_selected_on_marketplace}{' '}
            Plan via the AWS Marketplace. As a final step, you need to create a Supabase
            organization. That organization will be managed and billed through AWS Marketplace.
          </p>
          <p>
            You can read more on billing through AWS in our {''}
            {/*TODO(thomas): Update docs link once the new docs exist*/}
            <Link
              href="https://supabase.com/docs/guides/platform"
              target="_blank"
              className="underline"
            >
              Billing Docs.
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
    </>
  )
}

export default AwsMarketplaceCreateNewOrg
