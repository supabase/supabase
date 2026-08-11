import { useParams } from 'common'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  Button,
  cn,
  DialogSectionSeparator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { EnablePipelinesCallout } from '../EnablePipelinesCallout'
import { PipelineStatusName } from '../Replication.constants'
import { useDestinationInformation } from '../useDestinationInformation'
import { useIsETLPrivateAlpha } from '../useIsETLPrivateAlpha'
import { DestinationForm } from './DestinationForm'
import { DestinationType } from './DestinationPanel.types'
import { DestinationTypeSelection } from './DestinationTypeSelection'
import { ReadReplicaForm } from './ReadReplicaForm'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { DocsButton } from '@/components/ui/DocsButton'
import { useReplicationDestinationsQuery } from '@/data/replication/destinations-query'
import { checkLocalETLNotSetUp } from '@/data/replication/utils'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { DOCS_URL } from '@/lib/constants'

interface DestinationPanelProps {
  onSuccessCreateReadReplica?: () => void
}

export const DestinationPanel = ({ onSuccessCreateReadReplica }: DestinationPanelProps) => {
  const { ref: projectRef } = useParams()
  const enablePgReplicate = useIsETLPrivateAlpha()
  const { error: destinationsError } = useReplicationDestinationsQuery({ projectRef })
  const isLocalETLNotSetUp = checkLocalETLNotSetUp(destinationsError)

  const [urlDestinationType, setDestinationType] = useQueryState(
    'destinationType',
    parseAsStringEnum<DestinationType>([
      'Read Replica',
      'BigQuery',
      'Analytics Bucket',
      'DuckLake',
      'Snowflake',
      'ClickHouse',
    ]).withOptions({
      history: 'push',
      clearOnDefault: true,
    })
  )

  const [edit, setEdit] = useQueryState(
    'edit',
    parseAsInteger.withOptions({
      history: 'push',
      clearOnDefault: true,
    })
  )

  const visible = urlDestinationType !== null || edit !== null
  const editMode = edit !== null

  const {
    sourceId,
    pipeline,
    statusName,
    replicationNotEnabled,
    type: existingDestinationType,
    destinationFetcher,
  } = useDestinationInformation({ id: edit })
  const destinationType = existingDestinationType ?? urlDestinationType
  const invalidExistingDestination = destinationFetcher.error?.code === 404

  const existingDestination = editMode
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
    setDestinationType(null)
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

  const typeSelection = (
    <>
      <DestinationTypeSelection />
      <DialogSectionSeparator />
    </>
  )

  const pipelinesTypeSelection = (
    <>
      {typeSelection}
      {destinationType != null && isLocalETLNotSetUp && (
        <SheetSection className="pb-0!">
          <Admonition
            type="warning"
            title="Replication unavailable locally"
            description="Configure the replication API to manage Pipelines destinations in local development."
          />
        </SheetSection>
      )}
    </>
  )

  return (
    <>
      <Sheet open={visible} onOpenChange={handleOpenChange}>
        <SheetContent size="lg" showClose={false} className="max-w-3xl">
          <div className="flex flex-col h-full min-h-0" tabIndex={-1}>
            <SheetHeader className="flex items-center justify-between">
              <div>
                <SheetTitle>{editMode ? 'Edit destination' : 'Add destination'}</SheetTitle>
                <SheetDescription>
                  {editMode
                    ? 'Update the configuration for this destination.'
                    : 'Add a read replica or an external destination.'}
                </SheetDescription>
              </div>
              <DocsButton
                href={docsUrl}
                topic={`${destinationType ?? 'destination'} pipeline settings`}
              />
            </SheetHeader>

            {destinationType === 'Read Replica' ? (
              <ReadReplicaForm
                typeSelection={typeSelection}
                checkIsDirtyRef={checkIsDirtyRef}
                onClose={onClose}
                onCancel={confirmOnClose}
                onSuccess={() => onSuccessCreateReadReplica?.()}
              />
            ) : !enablePgReplicate ? (
              <div className="grow overflow-auto min-h-0">
                {pipelinesTypeSelection}
                <SheetSection>
                  <div className={cn('border rounded-md p-6 flex flex-col gap-y-4')}>
                    <div className="flex flex-col gap-y-1">
                      <h4>Request Pipelines access</h4>
                      <p className="text-sm text-foreground-light">
                        Pipelines is in <span className="text-foreground">public alpha</span> and
                        being rolled out gradually. Request access below to join the waitlist. Read
                        replicas are available now.
                      </p>
                    </div>
                    <div className="flex gap-x-2">
                      <Button
                        asChild
                        variant="secondary"
                        iconRight={<ArrowUpRight size={16} strokeWidth={1.5} />}
                      >
                        <Link
                          target="_blank"
                          rel="noreferrer"
                          href="https://forms.supabase.com/pg_replicate"
                        >
                          Request Pipelines access
                        </Link>
                      </Button>
                      <DocsButton href={`${DOCS_URL}/guides/database/replication#pipelines`} />
                    </div>
                  </div>
                </SheetSection>
              </div>
            ) : replicationNotEnabled ? (
              <div className="grow overflow-auto min-h-0">
                {pipelinesTypeSelection}
                <SheetSection>
                  <EnablePipelinesCallout className="p-6!" type={destinationType} />
                </SheetSection>
              </div>
            ) : (
              <DestinationForm
                visible={visible}
                selectedType={destinationType ?? 'Read Replica'}
                existingDestination={existingDestination}
                typeSelection={pipelinesTypeSelection}
                checkIsDirtyRef={checkIsDirtyRef}
                onClose={onClose}
                onCancel={confirmOnClose}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
      <DiscardChangesConfirmationDialog {...modalProps} />
    </>
  )
}
