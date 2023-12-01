import { useParams } from 'common'
import Link from 'next/link'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'

import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks'
import { useAppStateSnapshot } from 'state/app-state'

const BranchingPITRNotice = () => {
  const { ref } = useParams()
  const snap = useAppStateSnapshot()
  const org = useSelectedOrganization()

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: org?.slug })
  const isFreePlan = subscription?.plan.id === 'free'

  return (
    <Alert_Shadcn_ className="rounded-none px-7 py-6 [&>svg]:top-6 [&>svg]:left-6 !border-t-0 !border-l-0 !border-r-0">
      <AlertTitle_Shadcn_ className="text-base">
        We strongly encourage enabling Point in Time Recovery (PITR)
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        This is to ensure that you can always recover data if you make a "bad migration". For
        example, if you accidentally delete a column or some of your production data.
      </AlertDescription_Shadcn_>
      {isFreePlan && (
        <AlertDescription_Shadcn_ className="mt-2">
          To enable PITR, you may first upgrade your organization's plan to at least Pro, then
          purchase the PITR add on for your project via the{' '}
          <Link
            href={`/project/${ref}/settings/addons?panel=pitr`}
            className="text-brand"
            onClick={() => snap.setShowEnableBranchingModal(false)}
          >
            project settings
          </Link>
          .
        </AlertDescription_Shadcn_>
      )}
      <Button size="tiny" type="default" className="mt-4">
        <Link
          href={
            isFreePlan
              ? `/org/${org?.slug}/billing?panel=subscriptionPlan`
              : `/project/${ref}/settings/addons?panel=pitr`
          }
          onClick={() => snap.setShowEnableBranchingModal(false)}
        >
          {isFreePlan ? 'Upgrade to Pro' : 'Enable PITR add-on'}
        </Link>
      </Button>
    </Alert_Shadcn_>
  )
}

export default BranchingPITRNotice
