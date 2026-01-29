import { useFlag, useParams } from 'common'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import {
  Button,
  DialogSectionSeparator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetSection,
  SheetTitle,
  cn,
} from 'ui'

import { EnableReplicationCallout } from '../EnableReplicationCallout'
import { useIsETLPrivateAlpha } from '../useIsETLPrivateAlpha'
import { DestinationForm } from './DestinationForm'
import { DestinationType } from './DestinationPanel.types'
import { DestinationTypeSelection } from './DestinationTypeSelection'
import { ReadReplicaForm } from './ReadReplicaForm'
import { DocsButton } from '@/components/ui/DocsButton'
import { useReplicationSourcesQuery } from '@/data/replication/sources-query'
import { DOCS_URL } from '@/lib/constants'

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
  const enablePgReplicate = useIsETLPrivateAlpha()
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
            ) : unifiedReplication && !enablePgReplicate ? (
              <SheetSection>
                <div className={cn('border rounded-md p-6 flex flex-col gap-y-4')}>
                  <div className="flex flex-col gap-y-1">
                    <h4>Replicate data to external destinations in real-time</h4>
                    <p className="text-sm text-foreground-light">
                      We are currently in <span className="text-foreground">private alpha</span> and
                      slowly onboarding new customers to ensure stable data pipelines. Request
                      access below to join the waitlist. Read replicas are available now.
                    </p>
                  </div>
                  <div className="flex gap-x-2">
                    <Button
                      asChild
                      type="secondary"
                      iconRight={<ArrowUpRight size={16} strokeWidth={1.5} />}
                    >
                      <Link
                        href="https://forms.supabase.com/pg_replicate"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Request alpha access
                      </Link>
                    </Button>
                    <DocsButton href={`${DOCS_URL}/guides/database/replication#replication`} />
                  </div>
                </div>
              </SheetSection>
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
