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
      title: 'Object versioning is in Public Alpha',
      description:
        'This feature may change during development and is not recommended for production workloads.',
    }}
  >
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Storage usage and retained versions</h4>
      <p className="text-sm text-foreground-light">
        Any retained version counts toward Storage usage and may increase your bill.{' '}
        <InlineLink href={`${DOCS_URL}/guides/platform/manage-your-usage/storage-size`}>
          Read about Storage size and pricing
        </InlineLink>
        .
      </p>
    </div>
  </ConfirmationModal>
)
