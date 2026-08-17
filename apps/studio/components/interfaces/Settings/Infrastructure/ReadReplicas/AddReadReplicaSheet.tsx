import { parseAsBoolean, useQueryState } from 'nuqs'
import { useRef } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from 'ui'

import { ReadReplicaForm } from './ReadReplicaForm'
import type { RecommendedComputeForReadReplicas } from './recommendCompute'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { DocsButton } from '@/components/ui/DocsButton'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { DOCS_URL } from '@/lib/constants'

interface AddReadReplicaSheetProps {
  onSuccess?: () => void
  onRecommendCompute: (size: RecommendedComputeForReadReplicas) => void
}

export const AddReadReplicaSheet = ({
  onSuccess,
  onRecommendCompute,
}: AddReadReplicaSheetProps) => {
  const [addReplica, setAddReplica] = useQueryState(
    'addReplica',
    parseAsBoolean.withDefault(false).withOptions({
      history: 'push',
      clearOnDefault: true,
      scroll: false,
    })
  )

  const visible = addReplica === true
  const checkIsDirtyRef = useRef<() => boolean>(() => false)
  const pendingRecommendationRef = useRef<RecommendedComputeForReadReplicas | null>(null)

  const onClose = () => {
    checkIsDirtyRef.current = () => false
    setAddReplica(false)
  }

  const { confirmOnClose, handleOpenChange, modalProps } = useConfirmOnClose({
    checkIsDirty: () => checkIsDirtyRef.current(),
    onClose,
  })

  const closeWithRecommendation = (size: RecommendedComputeForReadReplicas) => {
    pendingRecommendationRef.current = size
    onClose()
  }

  return (
    <>
      <Sheet open={visible} onOpenChange={handleOpenChange}>
        <SheetContent
          size="lg"
          showClose={false}
          className="max-w-3xl"
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
          <div className="flex flex-col h-full min-h-0" tabIndex={-1}>
            <SheetHeader className="flex items-center justify-between">
              <div>
                <SheetTitle>Add read replica</SheetTitle>
                <SheetDescription>
                  Deploy a read-only copy of the complete Postgres database.
                </SheetDescription>
              </div>
              <DocsButton
                href={`${DOCS_URL}/guides/platform/read-replicas`}
                topic="read replica settings"
              />
            </SheetHeader>

            <ReadReplicaForm
              checkIsDirtyRef={checkIsDirtyRef}
              onClose={onClose}
              onCancel={confirmOnClose}
              onSuccess={() => onSuccess?.()}
              onRecommendCompute={closeWithRecommendation}
            />
          </div>
        </SheetContent>
      </Sheet>
      <DiscardChangesConfirmationDialog {...modalProps} />
    </>
  )
}
