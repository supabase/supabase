import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'

import { useParams } from 'common'
import { useCheckPermissions } from 'hooks'
import { useAppStateSnapshot } from 'state/app-state'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'

const BranchingPITRNotice = () => {
  const { ref } = useParams()
  const snap = useAppStateSnapshot()

  const canUpdateSubscription = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  return (
    <Alert_Shadcn_ className="rounded-none px-7 py-6 [&>svg]:top-6 [&>svg]:left-6 !border-t-0 !border-l-0 !border-r-0">
      <AlertTitle_Shadcn_ className="text-base">
        We strongly encourage enabling Point in Time Recovery (PITR)
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        This is to ensure that you can always recover data if you make a "bad migration". For
        example, if you accidentally delete a column or some of your production data.
      </AlertDescription_Shadcn_>
      {!canUpdateSubscription ? (
        <Tooltip_Shadcn_>
          <TooltipTrigger_Shadcn_ asChild>
            <Button disabled size="tiny" type="default" className="mt-4 pointer-events-auto">
              Enable PITR add-on
            </Button>
          </TooltipTrigger_Shadcn_>
          <TooltipContent_Shadcn_ side="bottom">
            You need additional permissions to amend subscriptions
          </TooltipContent_Shadcn_>
        </Tooltip_Shadcn_>
      ) : (
        <Button size="tiny" type="default" className="mt-4">
          <Link
            href={`/project/${ref}/settings/addons?panel=pitr`}
            onClick={() => snap.setShowEnableBranchingModal(false)}
          >
            Enable PITR add-on
          </Link>
        </Button>
      )}
    </Alert_Shadcn_>
  )
}

export default BranchingPITRNotice
