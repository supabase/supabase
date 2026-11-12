import { useFeatureFlags, useParams } from 'common'
import { ArrowUpRightIcon } from 'lucide-react'
import Link from 'next/link'
import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  DialogSectionSeparator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { useEnsurePipelineRegionSource } from '../CreatePipeline/useEnsurePipelineRegionSource'
import { EnablePipelinesCallout } from '../EnablePipelinesCallout'
import { PipelineStatusName } from '../Replication.constants'
import { canModifyDestination } from '../ReplicationDiagram/Nodes.utils'
import { UnknownDestinationNotice } from '../UnknownDestinationNotice'
import { useDestinationInformation } from '../useDestinationInformation'
import { useIsPipelinesEnabled } from '../useIsPipelinesEnabled'
import { usePreferredPipelineClusterId } from '../usePreferredPipelineClusterId'
import { DestinationForm } from './DestinationForm'
import { DESTINATION_DOCS_PATHS } from './DestinationPanel.constants'
import { DestinationType } from './DestinationPanel.types'
import { DestinationTypeSelection } from './DestinationTypeSelection'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { AlertError } from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { useReplicationDestinationsQuery } from '@/data/replication/destinations-query'
import { checkLocalPipelinesNotSetUp } from '@/data/replication/utils'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { DOCS_URL, IS_PLATFORM } from '@/lib/constants'
import { ReplicationClusterProvider, useReplicationClusterId } from '@/state/replication-cluster'

export const DestinationPanel = () => {
  const { ref: projectRef } = useParams()
  const { hasLoaded: flagsLoaded } = useFeatureFlags()
  const { isPending: isOrganizationPending } = useSelectedOrganizationQuery()
  const enablePgReplicate = useIsPipelinesEnabled()
  const isAccessLoading = IS_PLATFORM && (!flagsLoaded || isOrganizationPending)
  const { error: destinationsError } = useReplicationDestinationsQuery({ projectRef })
  const isLocalPipelinesNotSetUp = checkLocalPipelinesNotSetUp(destinationsError)

  const [urlDestinationType, setDestinationType] = useQueryState(
    'destinationType',
    parseAsStringEnum<DestinationType>([
      'BigQuery',
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
  const isUnknownDestination = editMode && existingDestinationType === 'Unknown'
  const destinationType =
    existingDestinationType === 'Unknown' ? null : (existingDestinationType ?? urlDestinationType)
  const invalidExistingDestination = destinationFetcher.error?.code === 404
  const hasDestinationError = editMode && destinationFetcher.isError && !invalidExistingDestination
  const showAccessRequest = !isAccessLoading && !enablePgReplicate
  const showEnablement = !isAccessLoading && enablePgReplicate && replicationNotEnabled
  const isEditLoading = editMode && destinationFetcher.isPending
  const canEditDestination = !editMode || canModifyDestination(existingDestinationType)
  const showDestinationForm =
    !isAccessLoading && enablePgReplicate && !replicationNotEnabled && canEditDestination

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

  const contextClusterId = useReplicationClusterId()
  const preferredCluster = usePreferredPipelineClusterId()
  // `null` until the user picks a region; until then a new pipeline starts in the preferred one.
  const [chosenClusterId, setChosenClusterId] = useState<string | undefined | null>(null)
  const creationClusterId = chosenClusterId === null ? preferredCluster.clusterId : chosenClusterId
  const { ensureRegionSource } = useEnsurePipelineRegionSource(projectRef)
  const handleRegionChange = (clusterId: string | undefined) => {
    setChosenClusterId(clusterId)
    void ensureRegionSource(clusterId)
  }

  // A preselected non-default region needs the project's source, as an explicit pick does.
  const ensuredPreferredClusterRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    const clusterId = preferredCluster.clusterId
    if (!visible || editMode || !showDestinationForm || chosenClusterId !== null) return
    if (clusterId === undefined || ensuredPreferredClusterRef.current === clusterId) return
    ensuredPreferredClusterRef.current = clusterId
    void ensureRegionSource(clusterId)
  }, [
    visible,
    editMode,
    showDestinationForm,
    chosenClusterId,
    preferredCluster.clusterId,
    ensureRegionSource,
  ])

  const onClose = () => {
    checkIsDirtyRef.current = () => false
    setDestinationType(null)
    setEdit(null)
    setChosenClusterId(null)
    ensuredPreferredClusterRef.current = undefined
  }

  const { confirmOnClose, handleOpenChange, modalProps } = useConfirmOnClose({
    checkIsDirty: () => checkIsDirtyRef.current(),
    onClose,
  })

  const destinationDocsPath = destinationType ? DESTINATION_DOCS_PATHS[destinationType] : undefined
  const docsUrl = `${DOCS_URL}${
    destinationDocsPath ?? '/guides/database/replication/pipelines#step-3-configure-a-destination'
  }`

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
      {destinationType != null && isLocalPipelinesNotSetUp && (
        <SheetSection className="pb-0!">
          <Admonition
            type="warning"
            title="Replication unavailable locally"
            description="Configure the replication API to manage pipelines in local development."
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
                <SheetTitle>{editMode ? 'Edit pipeline' : 'Add pipeline'}</SheetTitle>
                <SheetDescription>
                  {editMode
                    ? 'Update how this pipeline sends data to its destination.'
                    : 'Send tables to an external destination for analytics workloads.'}
                </SheetDescription>
              </div>
              <DocsButton
                href={docsUrl}
                topic={`${destinationType ?? 'destination'} pipeline settings`}
              />
            </SheetHeader>

            {(isAccessLoading || isEditLoading) && (
              <SheetSection>
                <GenericSkeletonLoader />
              </SheetSection>
            )}
            {isUnknownDestination && (
              <SheetSection>
                <UnknownDestinationNotice />
              </SheetSection>
            )}
            {hasDestinationError && (
              <SheetSection>
                <AlertError
                  error={destinationFetcher.error}
                  subject="Failed to retrieve destination information"
                  projectRef={projectRef}
                />
              </SheetSection>
            )}
            {showAccessRequest && (
              <div className="grow overflow-auto min-h-0">
                {pipelinesTypeSelection}
                <SheetSection>
                  <Admonition
                    type="note"
                    layout="responsive"
                    title="Request Pipelines access"
                    description="Pipelines is in public alpha and available to approved organizations."
                    actions={
                      <Button
                        asChild
                        variant="primary"
                        iconRight={<ArrowUpRightIcon size={16} strokeWidth={1.5} />}
                      >
                        <Link
                          target="_blank"
                          rel="noreferrer"
                          href="https://forms.supabase.com/pg_replicate"
                        >
                          Request access
                        </Link>
                      </Button>
                    }
                  />
                </SheetSection>
              </div>
            )}
            {showEnablement && (
              <div className="grow overflow-auto min-h-0">
                {pipelinesTypeSelection}
                <SheetSection>
                  <EnablePipelinesCallout type={destinationType} />
                </SheetSection>
              </div>
            )}
            {showDestinationForm && (
              <ReplicationClusterProvider
                clusterId={editMode ? contextClusterId : creationClusterId}
              >
                <DestinationForm
                  visible={visible}
                  selectedType={destinationType ?? 'BigQuery'}
                  existingDestination={existingDestination}
                  typeSelection={pipelinesTypeSelection}
                  checkIsDirtyRef={checkIsDirtyRef}
                  onClose={onClose}
                  onCancel={confirmOnClose}
                  onRegionChange={handleRegionChange}
                />
              </ReplicationClusterProvider>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <DiscardChangesConfirmationDialog {...modalProps} />
    </>
  )
}
