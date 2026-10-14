import type { AuthError, AuthMFARecoveryCodesGenerateResponseData } from '@supabase/auth-js'
import { useMutation } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
} from 'ui'

import { RecoveryCodesFlow } from './RecoveryCodesFlow'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'

type Trigger = { onClick: () => void; isPending: boolean }

export const PreviewRecoveryCodesFlow = ({
  children,
  action = 'regenerate',
}: {
  children?: (trigger: Trigger) => ReactNode
  action?: 'generate' | 'regenerate'
}) => {
  const mutation = useMutation<AuthMFARecoveryCodesGenerateResponseData, AuthError, void>({
    mutationFn: async () => ({
      id: 'preview',
      type: 'recovery_code',
      total: 10,
      codes: Array.from(
        { length: 10 },
        (_, index) => `PREVIEW-${String(index + 1).padStart(4, '0')}`
      ),
    }),
  })
  return (
    <RecoveryCodesFlow action={action} mutation={mutation} onGenerate={() => mutation.mutate()}>
      {children ?? (() => null)}
    </RecoveryCodesFlow>
  )
}

export const PreviewRemoveRecoveryCodesModal = ({
  children,
}: {
  children?: (trigger: Trigger) => ReactNode
}) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      {children?.({ onClick: () => setIsOpen(true), isPending: false })}
      <TextConfirmModal
        loading={false}
        visible={isOpen}
        size="small"
        variant="destructive"
        title="Delete my recovery codes"
        confirmPlaceholder="DELETE"
        confirmString="DELETE"
        confirmLabel="Delete"
        onConfirm={() => setIsOpen(false)}
        onCancel={() => setIsOpen(false)}
      >
        <p className="text-sm">Preview only. No recovery codes will be removed.</p>
      </TextConfirmModal>
    </>
  )
}

export const PreviewAuthenticatorDialog = ({
  visible,
  onClose,
  isRemoval = false,
}: {
  visible: boolean
  onClose: () => void
  isRemoval?: boolean
}) => (
  <Dialog
    open={visible}
    onOpenChange={(open) => {
      if (!open) onClose()
    }}
  >
    <DialogContent aria-describedby={undefined}>
      <DialogHeader>
        <DialogTitle>{isRemoval ? 'Remove authenticator' : 'Add authenticator'}</DialogTitle>
      </DialogHeader>
      <DialogSection>
        <p className="text-sm">Local preview only. Your account will not be changed.</p>
      </DialogSection>
      <DialogFooter>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={onClose}>
          {isRemoval ? 'Remove' : 'Done'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

export const PreviewGenerateRecoveryCodesFlow = ({
  children,
}: {
  children?: (trigger: Trigger) => ReactNode
}) => <PreviewRecoveryCodesFlow action="generate">{children}</PreviewRecoveryCodesFlow>
