import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Clock } from 'lucide-react'
import Link from 'next/link'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useAppStateSnapshot } from 'state/app-state'
import { Button } from 'ui'

export const BranchingPITRNotice = () => {
  const { ref } = useParams()
  const snap = useAppStateSnapshot()

  const canUpdateSubscription = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  return (
    <div className="flex flex-row gap-4">
      <div>
        <figure className="w-10 h-10 rounded-md border flex items-center justify-center">
          <Clock className="text-warning-700" size={20} strokeWidth={2} />
        </figure>
      </div>
      <div className="flex grow items-center justify-between gap-4">
        <div className="flex flex-col gap-y-1">
          <p className="text-sm text-foreground">Consider enabling Point in Time Recovery (PITR)</p>
          <p className="text-sm text-foreground-light">
            This ensures you can recover production data if you merge a bad migration (e.g. delete a
            column).
          </p>
        </div>
        {!canUpdateSubscription ? (
          <ButtonTooltip
            disabled
            size="tiny"
            type="default"
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
          <Button size="tiny" type="default" asChild>
            <Link
              href={`/project/${ref}/settings/addons?panel=pitr`}
              onClick={() => snap.setShowCreateBranchModal(false)}
            >
              Enable PITR
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
