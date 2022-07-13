import Link from 'next/link'
import dayjs from 'dayjs'
import { useState } from 'react'
import { Button, IconHelpCircle, IconLoader, Modal } from '@supabase/ui'

import { TIER_QUERY_LIMITS } from '.'
import { useProjectSubscription } from 'hooks'

interface Props {
  projectRef: string
  from: string
}

const UpgradePrompt: React.FC<Props> = ({ projectRef, from }) => {
  const [showHelperModal, setShowHelperModal] = useState(false)
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
      <div
        className={`flex flex-row items-center gap-3 px-2 py-1 text-xs transition-all ${
          isExceedingLimit
            ? 'text-yellow-1100  rounded border border-yellow-700 bg-yellow-200 font-semibold'
            : ''
        }`}
      >
        <span className="text-scale-1100">{`${queryLimit.text} retention`}</span>
        <IconHelpCircle
          size={16}
          strokeWidth={1.5}
          className="text-scale-1100 hover:text-scale-1200 cursor-pointer transition"
          onClick={() => setShowHelperModal(true)}
        />
        {queryLimit.promptUpgrade && (
          <Link href={`/project/${projectRef}/settings/billing`}>
            <Button size="tiny">Upgrade</Button>
          </Link>
        )}
      </div>

      <Modal
        hideFooter
        visible={showHelperModal}
        size="medium"
        header="Log retention"
        onCancel={() => setShowHelperModal(false)}
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
            <div className="flex items-center gap-2">
              <Button block type="primary" onClick={() => setShowHelperModal(false)}>
                Understood
              </Button>
            </div>
          </Modal.Content>
        </div>
      </Modal>
    </>
  )
}

export default UpgradePrompt
