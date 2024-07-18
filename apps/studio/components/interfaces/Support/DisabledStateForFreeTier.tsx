import Link from 'next/link'
import { Button, IconAlertCircle, IconExternalLink } from 'ui'

import InformationBox from 'components/ui/InformationBox'

interface DisabledStateForFreeTierProps {
  organizationSlug: string
  category: string
}

const DisabledStateForFreeTier = ({
  organizationSlug,
  category,
}: DisabledStateForFreeTierProps) => {
  return (
    <div className="px-6">
      <InformationBox
        hideCollapse
        defaultVisibility={true}
        icon={<IconAlertCircle className="text-foreground" size="large" strokeWidth={1.5} />}
        title={`Support for ${category} is only available on the Pro Plan`}
        description={
          <div className="space-y-4 mb-1">
            <p>Upgrade your project to the Pro Plan for support in this area</p>
            <div className="flex items-center space-x-2">
              <Button asChild>
                <Link href={`/org/${organizationSlug}/billing?panel=subscriptionPlan`}>
                  Upgrade project
                </Link>
              </Button>
              <Button asChild type="default" icon={<IconExternalLink size={14} />}>
                <Link href="https://supabase.com/pricing" target="_blank" rel="noreferrer">
                  About the Pro Plan
                </Link>
              </Button>
            </div>
          </div>
        }
      />
    </div>
  )
}

export default DisabledStateForFreeTier
