import Link from 'next/link'

import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { Button, Modal } from 'ui'
import { TIER_QUERY_LIMITS } from './Logs.constants'

interface Props {
  show: boolean
  setShowUpgradePrompt: (value: boolean) => void
}

const UpgradePrompt: React.FC<Props> = ({ show, setShowUpgradePrompt }) => {
  const organization = useSelectedOrganization()

  return (
    <Modal
      hideFooter
      visible={show}
      closable
      size="medium"
      header="Log retention"
      onCancel={() => setShowUpgradePrompt(false)}
    >
      <Modal.Content>
        <div className="space-y-4">
          <p className="text-sm">
            Logs can be retained up to a duration of 3 months depending on the plan that your
            project is on.
          </p>
          <div className="border-control bg-surface-300 rounded border">
            <div className="flex items-center px-4 pt-2 pb-1">
              <p className="text-foreground-light w-[40%] text-sm">Plan</p>
              <p className="text-foreground-light w-[60%] text-sm">Retention duration</p>
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
                <p className="w-[40%] text-sm">Team</p>
                <p className="w-[60%] text-sm">{TIER_QUERY_LIMITS.TEAM.text}</p>
              </div>
              <div className="flex items-center px-4 py-1">
                <p className="w-[40%] text-sm">Enterprise</p>
                <p className="w-[60%] text-sm">{TIER_QUERY_LIMITS.ENTERPRISE.text}</p>
              </div>
            </div>
          </div>
        </div>
      </Modal.Content>
      <Modal.Separator />
      <Modal.Content className="flex justify-end gap-3">
        <Button type="default" onClick={() => setShowUpgradePrompt(false)}>
          Close
        </Button>
        <Button asChild size="tiny">
          <Link href={`/org/${organization?.slug}/billing?panel=subscriptionPlan`}>Upgrade</Link>
        </Button>
      </Modal.Content>
    </Modal>
  )
}

export default UpgradePrompt
