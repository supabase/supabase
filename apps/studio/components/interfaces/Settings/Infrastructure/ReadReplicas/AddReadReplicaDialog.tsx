import { useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogSectionSeparator, DialogTitle } from 'ui'

import { ReadReplicaForm } from './ReadReplicaForm'
import { useCheckEligibilityDeployReplica } from './ReadReplicaForm/useCheckEligibilityDeployReplica'
import { useGetReplicaCost } from './ReadReplicaForm/useGetReplicaCost'
import type { RecommendedComputeForReadReplicas } from './recommendCompute'

interface AddReadReplicaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  onRecommendCompute: (size: RecommendedComputeForReadReplicas) => void
}

export const AddReadReplicaDialog = ({
  open,
  onOpenChange,
  onSuccess,
  onRecommendCompute,
}: AddReadReplicaDialogProps) => {
  const pendingRecommendationRef = useRef<RecommendedComputeForReadReplicas | null>(null)
  const eligibility = useCheckEligibilityDeployReplica()
  const replicaCost = useGetReplicaCost()

  const onClose = () => {
    onOpenChange(false)
  }

  const closeWithRecommendation = (size: RecommendedComputeForReadReplicas) => {
    pendingRecommendationRef.current = size
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="small"
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => {
          const recommendation = pendingRecommendationRef.current
          if (!recommendation) return

          // The recommendation replaces the trigger as the close destination.
          // Radix calls this after the close animation has completed.
          event.preventDefault()
          pendingRecommendationRef.current = null
          onRecommendCompute(recommendation)
        }}
      >
        <div className="flex min-h-0 flex-col" tabIndex={-1}>
          <DialogHeader>
            <DialogTitle>Add read replica</DialogTitle>
          </DialogHeader>
          <DialogSectionSeparator />

          <ReadReplicaForm
            eligibility={eligibility}
            onClose={onClose}
            onSuccess={() => onSuccess?.()}
            onRecommendCompute={closeWithRecommendation}
            replicaCost={replicaCost}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
