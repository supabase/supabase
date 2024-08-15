import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useAppStateSnapshot } from 'state/app-state'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'

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
        <ButtonTooltip
          disabled
          size="tiny"
          type="default"
          className="mt-4"
          tooltip={{
            content: {
              side: 'bottom',
              text: 'You need additional permissions to amend subscriptions',
            },
          }}
        >
          Enable PITR add-on
        </ButtonTooltip>
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
