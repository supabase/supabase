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

const AwsMarketplaceCreateNewOrg = () => {
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
      <ScaffoldSection>
        <ScaffoldSectionDetail>
          <p className="mb-6 text-base">
            You’ve subscribed to our product on the AWS Marketplace. As a final step, please create
            a Supabase organization. That organization will be managed and billed through AWS
            Marketplace.
          </p>
          <p className="text-xs">
            <span className="font-bold">Managed and billed through AWS Marketplace</span>
            <br />
            Supabase will no longer invoice you directly. Instead, AWS will handle billing for your
            Supabase subscription and charge the payment method saved in your AWS account. {''}
            <Link
              href="https://supabase.com/docs/guides/platform"
              target="_blank"
              className="underline"
            >
              Read more.
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
