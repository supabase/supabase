import dayjs from 'dayjs'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from 'ui'

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
      <Alert variant="warning">
        <AlertTitle className="text-foreground font-bold text-orange-1000">
          “Auto Renewal” is turned OFF for your AWS Marketplace subscription
        </AlertTitle>
        <AlertDescription className="flex flex-col gap-3 wrap-break-word">
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
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default AwsMarketplaceAutoRenewalWarning
