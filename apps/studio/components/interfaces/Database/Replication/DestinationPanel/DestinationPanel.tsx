import { useState } from 'react'

import { useReplicationSourcesQuery } from '@/data/replication/sources-query'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useFlag, useParams } from 'common'
import {
  cn,
  DialogSectionSeparator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { EnableReplicationCallout } from '../EnableReplicationCallout'
import { DestinationForm } from './DestinationForm'
import { DestinationType } from './DestinationPanel.types'
import { DestinationTypeSelection } from './DestinationTypeSelection'
import { ReadReplicaForm } from './ReadReplicaForm'

interface DestinationPanelProps {
  visible: boolean
  type?: DestinationType
  existingDestination?: {
    sourceId?: number
    destinationId: number
    pipelineId?: number
    enabled: boolean
    statusName?: string
  }
  onClose: () => void
  onSuccessCreateReadReplica?: () => void
}

export const DestinationPanel = ({
  visible,
  type,
  existingDestination,
  onClose,
  onSuccessCreateReadReplica,
}: DestinationPanelProps) => {
  const { ref: projectRef } = useParams()
  const unifiedReplication = useFlag('unifiedReplication')
  const { hasAccess: hasETLReplicationAccess } = useCheckEntitlements('replication.etl')

  const [selectedType, setSelectedType] = useState<DestinationType>(
    type || (unifiedReplication ? 'Read Replica' : 'BigQuery')
  )

  const editMode = !!existingDestination

  const { data: sourcesData, isSuccess: isSourcesSuccess } = useReplicationSourcesQuery({
    projectRef,
  })
  const sourceId = sourcesData?.sources.find((s) => s.name === projectRef)?.id
  const replicationNotEnabled = isSourcesSuccess && !sourceId

  return (
    <>
      <Sheet open={visible} onOpenChange={onClose}>
        <SheetContent
          size="default"
          showClose={false}
          className={cn(unifiedReplication ? 'md:!w-[850px]' : 'md:!w-[700px]')}
        >
          <div className="flex flex-col h-full" tabIndex={-1}>
            <SheetHeader>
              <SheetTitle>{editMode ? 'Edit destination' : 'Create a new destination'}</SheetTitle>
              <SheetDescription>
                {editMode
                  ? 'Update the configuration for this destination'
                  : 'A destination is an external platform that automatically receives your database changes in real time.'}
              </SheetDescription>
            </SheetHeader>

            <DestinationTypeSelection
              editMode={editMode}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
            />

            <DialogSectionSeparator />

            {selectedType === 'Read Replica' ? (
              <ReadReplicaForm onClose={onClose} onSuccess={() => onSuccessCreateReadReplica?.()} />
            ) : unifiedReplication && replicationNotEnabled ? (
              <SheetSection>
                <EnableReplicationCallout
                  className="!p-6"
                  type={selectedType}
                  hasAccess={hasETLReplicationAccess}
                />
              </SheetSection>
            ) : (
              <DestinationForm
                visible={visible}
                selectedType={selectedType}
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
