import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Calendar } from 'lucide-react'
import Link from 'next/link'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { getPITRRetentionDuration } from './PITR.utils'

const PITRNotice = ({}) => {
  const { ref: projectRef } = useParams()
  const { data: addonsResponse } = useProjectAddonsQuery({ projectRef })
  const retentionPeriod = getPITRRetentionDuration(addonsResponse?.selected_addons ?? [])

  const { can: canUpdateSubscription } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  return (
    <FormPanel
      disabled={true}
      footer={
        <div className="flex items-center justify-between p-6">
          <span className="text-sm text-foreground-light">
            You can also increase your recovery retention period updating your PITR add-on
          </span>
          <ButtonTooltip
            asChild
            disabled={!canUpdateSubscription}
            type="default"
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateSubscription
                  ? 'You need additional permissions to amend subscriptions'
                  : undefined,
              },
            }}
          >
            <Link href={`/project/${projectRef}/settings/addons?panel=pitr`}>
              Increase retention period
            </Link>
          </ButtonTooltip>
        </div>
      }
    >
      <div className="flex p-6 space-x-6">
        <div className="flex items-center justify-center w-10 h-10 rounded bg-border-strong">
          <Calendar strokeWidth={2} />
        </div>
        <div className="space-y-2">
          <p className="text-sm">Recovery retention period</p>
          <p className="text-sm text-foreground-light">
            Database changes are logged every <span className="text-foreground">2 minutes</span>,
            with a total recovery period of up to{' '}
            <span className="text-brand">{retentionPeriod} days</span>.
          </p>
        </div>
      </div>
    </FormPanel>
  )
}

export default PITRNotice
