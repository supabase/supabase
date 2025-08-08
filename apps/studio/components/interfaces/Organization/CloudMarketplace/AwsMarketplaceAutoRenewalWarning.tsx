import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_ } from 'ui'
import dayjs from 'dayjs'
import Link from 'next/link'

interface Props {
  awsContractEndDate: string
  awsContractSettingsUrl: string
}

const AwsMarketplaceAutoRenewalWarning = ({
  awsContractEndDate,
  awsContractSettingsUrl,
}: Props) => {
  return (
    <div className="mt-5 mb-10">
      <Alert_Shadcn_ variant="warning">
        <AlertTitle_Shadcn_ className="text-foreground font-bold text-orange-1000">
          “Auto Renewal” is turned OFF for your AWS Marketplace subscription
        </AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_ className="flex flex-col gap-3 break-words">
          <div>
            As a result, your Supabase organization will be downgraded to the Free Plan on{' '}
            {dayjs(awsContractEndDate).format('MMMM DD')}. If you have more than 2 projects running,
            all your projects will be paused. To ensure uninterrupted service, enable “Auto Renewal”
            in your {''}
            <Link href={awsContractSettingsUrl} target="_blank" className="underline">
              AWS Marketplace subscription settings
            </Link>
            .
          </div>
        </AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    </div>
  )
}

export default AwsMarketplaceAutoRenewalWarning
