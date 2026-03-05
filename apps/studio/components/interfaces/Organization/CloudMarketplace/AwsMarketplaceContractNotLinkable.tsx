import { CloudMarketplaceContractLinkingIneligibilityReason } from './cloud-marketplace-query'
import { Button, Card, CardContent } from 'ui'
import Link from 'next/link'
import { SupportLink } from '../../Support/SupportLink'

interface Props {
  reason: CloudMarketplaceContractLinkingIneligibilityReason
}

const AwsMarketplaceContractNotLinkable = ({ reason }: Props) => {
  return (
    <div className="mt-5 mb-10">
      <Card className="p-4">
        <CardContent>{determineCardContent(reason)}</CardContent>
      </Card>
    </div>
  )
}

function determineCardContent(reason: CloudMarketplaceContractLinkingIneligibilityReason) {
  switch (reason) {
    case 'NO_ACTIVE_CONTRACT_FOUND':
      return (
        <p>
          Thanks for purchasing Supabase through the AWS Marketplace. It’ll take a moment for all
          systems to sync before you can link your Supabase organization to the AWS Marketplace.
          Please try again in a few minutes.
        </p>
      )

    case 'AWS_ACTIVATE_CREDITS_DEAL':
      return (
        <>
          <p className="mb-4">
            You’ve accepted a private offer for Supabase credits as part of AWS Activate. No further
            action is required on your end.
          </p>
          <p>
            Your Supabase organization’s credit balance will be updated accordingly. Please note
            that it may take 1 or 2 days for this change to appear on the Dashboard. You can find
            the credit balance on the{' '}
            <Link className="underline" href={'/org/_/billing'}>
              organization's billing page
            </Link>
            .
          </p>

          <Button asChild type="primary" size="medium" className="mt-8">
            <Link href="/organizations">Go to Dashboard</Link>
          </Button>
        </>
      )

    case 'AGREEMENT_BASED_OFFER':
      return (
        <>
          <p>
            You’ve accepted a private offer that updated or extended an existing Supabase
            subscription on the AWS Marketplace. No further action is required on your end. Your
            Supabase organization will remain linked to the AWS Marketplace, and your projects will
            continue to run as usual.
          </p>

          <Button asChild type="primary" size="medium" className="mt-8">
            <Link href="/organizations">Go to Dashboard</Link>
          </Button>
        </>
      )

    default:
      return (
        <p>
          Unable to determine the reason why AWS Marketplace onboarding is not possible.{' '}
          <SupportLink className="underline">Contact support.</SupportLink>
        </p>
      )
  }
}

export default AwsMarketplaceContractNotLinkable
