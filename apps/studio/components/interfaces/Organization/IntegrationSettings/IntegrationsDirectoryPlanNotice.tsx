import { AlertCircleIcon } from 'lucide-react'
import Link from 'next/link'

import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useAppStateSnapshot } from 'state/app-state'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'

const IntegrationsDirectoryPlanNotice = () => {
  const snap = useAppStateSnapshot()
  const selectedOrg = useSelectedOrganization()

  return (
    <Alert_Shadcn_ className="px-6 py-4 [&>svg]:top-6 [&>svg]:left-6 bg-alternative border-alternative rounded-md">
      <AlertCircleIcon />
      <AlertTitle_Shadcn_>
        Integrations directory is only available on the Pro plan and above
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        Go to your organization's billing settings and upgrade your plan to enable integrations
        directory for this project
      </AlertDescription_Shadcn_>
      <AlertDescription_Shadcn_>
        <Button size="tiny" type="default" className="mt-4" asChild>
          <Link href={`/org/${selectedOrg?.slug}/billing?panel=subscriptionPlan`}>
            Upgrade to Pro
          </Link>
        </Button>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

export default IntegrationsDirectoryPlanNotice
