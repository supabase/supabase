import { FC } from 'react'
import { Button, Typography } from '@supabase/ui'

interface Props {
  organization: any
}

const AWSMarketplaceSubscription: FC<Props> = ({ organization }) => {
  return (
    <div className="flex flex-col space-y-4">
      <Typography.Text>
        This organization is subscribed via AWS Marketplace, with a limit of{' '}
        {organization.project_limit} projects and expiring on{' '}
        {organization.aws_marketplace.Entitlements[0].ExpirationDate.slice(0, 10)}.
      </Typography.Text>

      <Button>
        <a
          href="https://aws.amazon.com/marketplace/saas/ordering?productId=dc498450-cecf-44c2-8c99-c3c13f16e70a&offerId=d1htt16t3ygx5brtwhooms0ei"
          target="_blank"
        >
          Manage AWS Marketplace subscription
        </a>
      </Button>
    </div>
  )
}

export default AWSMarketplaceSubscription
