import Link from 'next/link'
import { Button, IconCalendar } from 'ui'
import { FormPanel } from 'components/ui/Forms'
import { useParams, useProjectSubscription } from 'hooks'
import { getPITRRetentionDuration } from './PITR.utils'

const PITRNotice = ({}) => {
  const { ref } = useParams()
  const { subscription } = useProjectSubscription(ref)
  const retentionPeriod = getPITRRetentionDuration(subscription?.addons ?? [])

  return (
    <FormPanel
      disabled={true}
      footer={
        <div className="flex items-center justify-between p-6">
          <span className="text-scale-1000 text-sm">
            You can also increase your recovery retention period updating your PITR add-on
          </span>
          <Link href={`/project/${ref}/settings/billing/update/pro`}>
            <a>
              <Button as="span" type="default">
                Increase retention period
              </Button>
            </a>
          </Link>
        </div>
      }
    >
      <div className="p-6 flex space-x-6">
        <div className="h-10 w-10 rounded flex items-center justify-center bg-scale-700">
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
