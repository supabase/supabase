import Link from 'next/link'
import dayjs from 'dayjs'
import { Button, IconLoader, Modal } from '@supabase/ui'
import { SetStateAction } from 'react'
import { TIER_QUERY_LIMITS } from '.'
import { useProjectSubscription } from 'hooks'

interface Props {
  projectRef: string
  from: string
  showUpgradePrompt: boolean
  setShowUpgradePrompt: React.Dispatch<SetStateAction<boolean>>
}

const UpgradePrompt: React.FC<Props> = ({
  projectRef,
  from,
  showUpgradePrompt,
  setShowUpgradePrompt,
}) => {
  const { subscription, isLoading, isError } = useProjectSubscription(projectRef)
  if (isLoading) return <IconLoader size={16} className="animate-spin" />
  if (isError) console.error('Error fetching project subscription')

  const tier = subscription?.tier
  const queryLimit = TIER_QUERY_LIMITS[(tier?.key || 'FREE') as keyof typeof TIER_QUERY_LIMITS]

  const fromValue = from ? dayjs(from) : dayjs()
  const fromMax = dayjs().startOf('day').subtract(queryLimit.value, queryLimit.unit)
  const isExceedingLimit = fromValue.isBefore(fromMax)

  return (
    <>
      <Modal
        hideFooter
        visible={showUpgradePrompt}
        closable
        size="medium"
        header="Log retention"
        onCancel={() => setShowUpgradePrompt(false)}
      >
        <div className="space-y-4 py-4">
          <Modal.Content>
            <div className="space-y-4">
              <p className="text-sm">
                Logs can be retained up to a duration of 3 months depending on the plan that your
                project is on. The table below shows an overview of the duration for which your logs
                will be retained for based on each plan.
              </p>
              <div className="border-scale-600 bg-scale-500 rounded border">
                <div className="flex items-center px-4 pt-2 pb-1">
                  <p className="text-scale-1100 w-[40%] text-sm">Plan</p>
                  <p className="text-scale-1100 w-[60%] text-sm">Retention duration</p>
                </div>
                <div className="py-1">
                  <div className="flex items-center px-4 py-1">
                    <p className="w-[40%] text-sm">Free</p>
                    <p className="w-[60%] text-sm">{TIER_QUERY_LIMITS.FREE.text}</p>
                  </div>
                  <div className="flex items-center px-4 py-1">
                    <p className="w-[40%] text-sm">Pro</p>
                    <p className="w-[60%] text-sm">{TIER_QUERY_LIMITS.PRO.text}</p>
                  </div>
                  <div className="flex items-center px-4 py-1">
                    <p className="w-[40%] text-sm">Enterprise</p>
                    <p className="w-[60%] text-sm">{TIER_QUERY_LIMITS.ENTERPRISE.text}</p>
                  </div>
                </div>
              </div>
            </div>
          </Modal.Content>
          <Modal.Seperator />
          <Modal.Content>
            <div className="flex justify-between">
              <Button type="default" onClick={() => setShowUpgradePrompt(false)}>
                Close
              </Button>

              <Link href={`/project/${projectRef}/settings/billing`}>
                <Button size="tiny">Upgrade</Button>
              </Link>
            </div>
          </Modal.Content>
        </div>
      </Modal>
    </>
  )
}

export default UpgradePrompt
