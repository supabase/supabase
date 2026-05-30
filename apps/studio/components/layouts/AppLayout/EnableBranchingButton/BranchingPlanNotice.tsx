import { AlertCircleIcon } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle, Button } from 'ui'

import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useAppStateSnapshot } from '@/state/app-state'

export const BranchingPlanNotice = () => {
  const snap = useAppStateSnapshot()
  const { data: selectedOrg } = useSelectedOrganizationQuery()

  return (
    <Alert className="rounded-none px-7 py-6 [&>svg]:top-6 [&>svg]:left-6 border-0 border-t">
      <AlertCircleIcon />
      <AlertTitle>Database branching is only available on the Pro Plan and above</AlertTitle>
      <AlertDescription>
        Go to your organization's billing settings and upgrade your plan to enable branching for
        this project
      </AlertDescription>
      <AlertDescription>
        <Button size="tiny" type="default" className="mt-4">
          <Link
            href={`/org/${selectedOrg?.slug}/billing?panel=subscriptionPlan&source=enableBranchingButton`}
            onClick={() => snap.setShowCreateBranchModal(false)}
          >
            Upgrade to Pro
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
