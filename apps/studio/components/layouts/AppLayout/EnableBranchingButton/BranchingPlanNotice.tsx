import Link from 'next/link'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'

import { AlertCircleIcon } from 'lucide-react'
import { useAppStateSnapshot } from 'state/app-state'
import { useSelectedOrganization } from 'hooks'

const BranchingPlanNotice = () => {
  const snap = useAppStateSnapshot()
  const selectedOrg = useSelectedOrganization()

  return (
    <Alert_Shadcn_ className="rounded-none px-7 py-6 [&>svg]:top-6 [&>svg]:left-6 border-0 border-y">
      <AlertCircleIcon />
      <AlertTitle_Shadcn_ className="text-base">
        Database branching is only available on the Pro plan and above
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        Go to your organization's billing settings and upgrade your plan to enable branching for
        this project
      </AlertDescription_Shadcn_>
      <AlertDescription_Shadcn_>
        <Button size="tiny" type="default" className="mt-4">
          <Link
            href={`/org/${selectedOrg?.slug}/billing?panel=subscriptionPlan`}
            onClick={() => snap.setShowEnableBranchingModal(false)}
          >
            Upgrade to Pro
          </Link>
        </Button>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

export default BranchingPlanNotice
