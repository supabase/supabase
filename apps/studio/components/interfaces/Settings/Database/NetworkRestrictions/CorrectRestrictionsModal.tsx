import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import type { RestrictionCorrection } from './NetworkRestrictions.utils'

interface CorrectRestrictionsModalProps {
  visible: boolean
  title: string
  confirmLabel: string
  corrections: RestrictionCorrection[]
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const CorrectRestrictionsModal = ({
  visible,
  title,
  confirmLabel,
  corrections,
  loading,
  onConfirm,
  onCancel,
}: CorrectRestrictionsModalProps) => (
  <ConfirmationModal
    visible={visible}
    size="medium"
    title={title}
    description="Entries that aren't valid IP ranges are saved with these corrections."
    confirmLabel={confirmLabel}
    loading={loading}
    onConfirm={onConfirm}
    onCancel={onCancel}
  >
    <ul className="space-y-1 text-sm">
      {corrections.map(({ entry, replacement }, index) => (
        <li key={`${entry}-${index}`} className="font-mono">
          {entry} <span>{replacement === undefined ? '(removed)' : `→ ${replacement}`}</span>
        </li>
      ))}
    </ul>
  </ConfirmationModal>
)
