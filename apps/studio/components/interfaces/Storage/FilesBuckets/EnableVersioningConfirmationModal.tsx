import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { InlineLink } from '@/components/ui/InlineLink'
import { DOCS_URL } from '@/lib/constants'

interface EnableVersioningConfirmationModalProps {
  visible: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const EnableVersioningConfirmationModal = ({
  visible,
  loading = false,
  onConfirm,
  onCancel,
}: EnableVersioningConfirmationModalProps) => (
  <ConfirmationModal
    variant="warning"
    visible={visible}
    loading={loading}
    title="Confirm to enable object versioning"
    confirmLabel="Enable versioning"
    confirmLabelLoading="Enabling versioning..."
    onCancel={onCancel}
    onConfirm={onConfirm}
    alert={{
      title: 'Storage object versioning is in public alpha',
      description:
        'The behavior of this feature may change during development and is not recommended production use.',
    }}
  >
    <div className="space-y-2">
      <p className="text-sm text-foreground-light">
        Any retained version counts toward Storage usage and may increase your bill.{' '}
        <InlineLink href={`${DOCS_URL}/guides/platform/manage-your-usage/storage-size`}>
          Read docs
        </InlineLink>
      </p>
    </div>
  </ConfirmationModal>
)
