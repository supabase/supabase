import { parseAsInteger, useQueryState } from 'nuqs'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from 'ui'

import { PipelineStatusName } from '../Replication.constants'
import { useDestinationInformation } from '../useDestinationInformation'
import { DestinationForm } from './DestinationForm'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { DocsButton } from '@/components/ui/DocsButton'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { DOCS_URL } from '@/lib/constants'

export const DestinationPanel = () => {
  const [edit, setEdit] = useQueryState(
    'edit',
    parseAsInteger.withOptions({
      history: 'push',
      clearOnDefault: true,
    })
  )

  // Create uses the full-page wizard at /database/replication/new; this sheet is edit-only.
  const visible = edit !== null

  const {
    sourceId,
    pipeline,
    statusName,
    type: existingDestinationType,
    destinationFetcher,
  } = useDestinationInformation({ id: edit })
  const destinationType = existingDestinationType
  const invalidExistingDestination = destinationFetcher.error?.code === 404

  const existingDestination =
    edit !== null
      ? {
          sourceId,
          destinationId: edit,
          pipelineId: pipeline?.id,
          statusName,
          enabled:
            statusName === PipelineStatusName.STARTED || statusName === PipelineStatusName.FAILED,
        }
      : undefined

  const checkIsDirtyRef = useRef<() => boolean>(() => false)

  const onClose = () => {
    checkIsDirtyRef.current = () => false
    setEdit(null)
  }

  const { confirmOnClose, handleOpenChange, modalProps } = useConfirmOnClose({
    checkIsDirty: () => checkIsDirtyRef.current(),
    onClose,
  })

  const docsUrl =
    destinationType === 'BigQuery'
      ? `${DOCS_URL}/guides/database/replication/bigquery#configure-bigquery-as-a-destination`
      : `${DOCS_URL}/guides/database/replication/pipelines#step-3-configure-a-destination`

  useEffect(() => {
    if (edit !== null && invalidExistingDestination) {
      toast(`Unable to find destination ID ${edit}`)
      setEdit(null)
    }
  }, [edit, invalidExistingDestination, setEdit])

  return (
    <>
      <Sheet open={visible} onOpenChange={handleOpenChange}>
        <SheetContent size="lg" showClose={false} className="max-w-3xl">
          <div className="flex flex-col h-full min-h-0" tabIndex={-1}>
            <SheetHeader className="flex items-center justify-between">
              <div>
                <SheetTitle>Edit destination</SheetTitle>
                <SheetDescription>Update the configuration for this destination.</SheetDescription>
              </div>
              <DocsButton
                href={docsUrl}
                topic={`${destinationType ?? 'destination'} pipeline settings`}
              />
            </SheetHeader>

            {destinationType ? (
              <DestinationForm
                visible={visible}
                selectedType={destinationType}
                existingDestination={existingDestination}
                checkIsDirtyRef={checkIsDirtyRef}
                onClose={onClose}
                onCancel={confirmOnClose}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
      <DiscardChangesConfirmationDialog {...modalProps} />
    </>
  )
}
