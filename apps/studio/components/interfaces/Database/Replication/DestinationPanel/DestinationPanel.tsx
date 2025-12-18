import { useState } from 'react'

import { useFlag } from 'common'
import {
  cn,
  DialogSectionSeparator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from 'ui'
import { DestinationForm } from './DestinationForm'
import { DestinationType } from './DestinationPanel.types'
import { DestinationTypeSelection } from './DestinationTypeSelection'

interface DestinationPanelProps {
  visible: boolean
  existingDestination?: {
    sourceId?: number
    destinationId: number
    pipelineId?: number
    enabled: boolean
    statusName?: string
  }
  onClose: () => void
}

export const DestinationPanel = ({
  visible,
  existingDestination,
  onClose,
}: DestinationPanelProps) => {
  const unifiedReplication = useFlag('unifiedReplication')

  const [selectedType, setSelectedType] = useState<DestinationType>(
    unifiedReplication ? 'Read Replica' : 'BigQuery'
  )

  const editMode = !!existingDestination

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
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-foreground-lighter text-sm">Coming soon</p>
              </div>
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
