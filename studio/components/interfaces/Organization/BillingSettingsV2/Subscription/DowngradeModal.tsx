import { PricingInformation } from 'shared-data'
import { Alert, IconAlertOctagon, IconMinusCircle, IconPauseCircle, Modal } from 'ui'

export interface DowngradeModalProps {
  visible: boolean
  selectedTier?: PricingInformation
  onClose: () => void
  onConfirm: () => void
}

const DowngradeModal = ({ visible, selectedTier, onClose, onConfirm }: DowngradeModalProps) => {
  return (
    <Modal
      size="medium"
      alignFooter="right"
      visible={visible}
      onCancel={onClose}
      onConfirm={onConfirm}
      header={`Confirm to downgrade to ${selectedTier?.name} plan`}
    >
      <Modal.Content>
        <div className="py-6">
          <Alert
            withIcon
            variant="warning"
            title="Downgrading to the free plan will lead to reductions in your project's capacity"
          >
            <p>
              If you're already past the limits of the free plan, your project could become
              unresponsive or enter read only mode.
            </p>
          </Alert>

          {/* [Joshen] Improvement area: Show which projects might be most affected by the downgrade? */}
          {/* [Joshen] Improvement area: Show which projects addons will be removed */}

          <ul className="mt-4 space-y-5 text-sm">
            <li className="flex gap-3">
              <IconMinusCircle />
              <span>Add ons from all projects under this organization will be removed.</span>
            </li>

            <li className="flex gap-3">
              <div>
                <IconPauseCircle />
              </div>
              <span>
                Your projects will be paused if it exceeds the free plan quotas, or after a week of
                inactivity
              </span>
            </li>

            <li className="flex gap-3">
              <IconAlertOctagon w={14} className="flex-shrink-0" />
              <div>
                <strong>Before you downgrading to the {selectedTier?.name} plan, consider:</strong>
                <ul className="space-y-2 mt-2">
                  <li className="list-disc ml-4">
                    Your projects no longer require their respective add ons.
                  </li>
                  <li className="list-disc ml-4">
                    Your projects are currently consuming resources that are well within the{' '}
                    {selectedTier?.name} plan's quota.
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </div>
      </Modal.Content>
    </Modal>
  )
}

export default DowngradeModal
