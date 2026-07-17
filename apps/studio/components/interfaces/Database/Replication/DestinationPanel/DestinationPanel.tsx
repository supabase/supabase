import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs'
import { useEffect } from 'react'
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

import { EnablePipelinesCallout } from '../EnablePipelinesCallout'
import { PipelineStatusName } from '../Replication.constants'
import { useDestinationInformation } from '../useDestinationInformation'
import { useIsETLPrivateAlpha } from '../useIsETLPrivateAlpha'
import { DestinationForm } from './DestinationForm'
import { DestinationType } from './DestinationPanel.types'
import { DestinationTypeSelection } from './DestinationTypeSelection'
import { ReadReplicaForm } from './ReadReplicaForm'
import { DocsButton } from '@/components/ui/DocsButton'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { DOCS_URL } from '@/lib/constants'

interface DestinationPanelProps {
  onSuccessCreateReadReplica?: () => void
}

export const DestinationPanel = ({ onSuccessCreateReadReplica }: DestinationPanelProps) => {
  const enablePgReplicate = useIsETLPrivateAlpha()
  const { hasAccess: hasETLReplicationAccess } = useCheckEntitlements('replication.etl')

  const [urlDestinationType, setDestinationType] = useQueryState(
    'destinationType',
    parseAsStringEnum<DestinationType>([
      'Read Replica',
      'BigQuery',
      'Analytics Bucket',
      'DuckLake',
      'Snowflake',
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

  const onClose = () => {
    setDestinationType(null)
    setEdit(null)
  }

  const docsUrl =
    urlDestinationType === 'BigQuery'
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
      <Sheet open={visible} onOpenChange={onClose}>
        <SheetContent size="lg" showClose={false}>
          <div className="flex flex-col h-full" tabIndex={-1}>
            <SheetHeader className="flex items-center justify-between">
              <div>
                <SheetTitle>{editMode ? 'Edit destination' : 'Add new destination'}</SheetTitle>
                <SheetDescription>
                  {editMode
                    ? 'Update the configuration for this destination.'
                    : 'Set up a read replica or Supabase Pipelines destination for near real-time replication'}
                </SheetDescription>
              </div>
              <DocsButton href={docsUrl} topic={`${urlDestinationType} pipeline settings`} />
            </SheetHeader>

            <DestinationTypeSelection />

            <DialogSectionSeparator />

            {destinationType === 'Read Replica' ? (
              <ReadReplicaForm onClose={onClose} onSuccess={() => onSuccessCreateReadReplica?.()} />
            ) : !enablePgReplicate ? (
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
            ) : replicationNotEnabled ? (
              <SheetSection>
                <EnablePipelinesCallout
                  className="p-6!"
                  type={destinationType}
                  hasAccess={hasETLReplicationAccess}
                />
              </SheetSection>
            ) : (
              <DestinationForm
                visible={visible}
                selectedType={destinationType ?? 'Read Replica'}
                existingDestination={existingDestination}
                onClose={onClose}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
