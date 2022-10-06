import { Button, Modal } from '@supabase/ui'
import { useEffect, useState } from 'react'
import { useProjectSubscription } from 'hooks'
import { useRouter } from 'next/router'
import { maybeShowUpgradePrompt, TIER_QUERY_LIMITS } from 'components/interfaces/Settings/Logs'
import Link from 'next/link'
import { StripeProduct } from 'components/interfaces/Billing'

export const useUpgradePrompt = (from: string) => {
  const router = useRouter()
  const { ref } = router.query
  const { subscription } = useProjectSubscription(ref as string)
  const tier = subscription?.tier
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  const shouldShowUpgradePrompt = maybeShowUpgradePrompt(from, tier as StripeProduct)

  useEffect(() => {
    if (shouldShowUpgradePrompt) {
      setShowUpgradePrompt(true)
    }
  }, [from])

  const UpgradePrompt = (
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

            <Link href={`/project/${ref}/settings/billing`}>
              <Button size="tiny">Upgrade</Button>
            </Link>
          </div>
        </Modal.Content>
      </div>
    </Modal>
  )
  return { UpgradePrompt, showUpgradePrompt, setShowUpgradePrompt, shouldShowUpgradePrompt }
}
