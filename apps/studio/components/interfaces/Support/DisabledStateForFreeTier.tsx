import { AlertCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'

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
        defaultVisibility
        icon={<AlertCircle className="text-foreground" size={20} strokeWidth={1.5} />}
        title={`Support for ${category} is only available on the Pro Plan`}
        description={
          <div className="space-y-4 mb-1">
            <p>Upgrade your organization to the Pro Plan for support in this area</p>
            <div className="flex items-center space-x-2">
              <Button asChild>
                <Link href={`/org/${organizationSlug}/billing?panel=subscriptionPlan`}>
                  Upgrade plan
                </Link>
              </Button>
              <Button asChild type="default" icon={<ExternalLink />}>
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
