import Link from 'next/link'
import { Button, IconCalendar } from 'ui'
import { FormPanel } from 'components/ui/Forms'
import * as Tooltip from '@radix-ui/react-tooltip'
import { checkPermissions } from 'hooks'
import { useParams } from 'common/hooks'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import { getPITRRetentionDuration } from './PITR.utils'
import { PermissionAction } from '@supabase/shared-types/out/constants'

const PITRNotice = ({}) => {
  const { ref: projectRef } = useParams()
  const { data: subscription } = useProjectSubscriptionQuery({ projectRef })
  const retentionPeriod = getPITRRetentionDuration(subscription?.addons ?? [])

  const canUpdateSubscription = checkPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  return (
    <FormPanel
      disabled={true}
      footer={
        <div className="flex items-center justify-between p-6">
          <span className="text-sm text-scale-1000">
            You can also increase your recovery retention period updating your PITR add-on
          </span>
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger>
              <Button disabled={canUpdateSubscription} as="span" type="default">
                <Link href={`/project/${projectRef}/settings/billing/update/pro`}>
                  <a>Increase retention period</a>
                </Link>
              </Button>
            </Tooltip.Trigger>
            {!canUpdateSubscription && (
              <Tooltip.Portal>
                <Tooltip.Content side="left">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                      'border border-scale-200',
                    ].join(' ')}
                  >
                    <span className="text-xs text-scale-1200">
                      You need additional permissions to amend subscriptions
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </div>
      }
    >
      <div className="flex p-6 space-x-6">
        <div className="flex items-center justify-center w-10 h-10 rounded bg-scale-700">
          <IconCalendar strokeWidth={2} />
        </div>
        <div className="space-y-2">
          <p className="text-sm">Recovery retention period</p>
          <p className="text-sm text-scale-1100">
            Database changes are logged every <span className="text-scale-1200">2 minutes</span>,
            with a total recovery period of up to{' '}
            <span className="text-brand-900">{retentionPeriod} days</span>.
          </p>
        </div>
      </div>
    </FormPanel>
  )
}

export default PITRNotice
