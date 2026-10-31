import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'

import { StorageItem, StorageItemWithColumn } from '../Storage.types'
import { MoveItemsFolderPicker } from './MoveItemsFolderPicker'
import {
  getDestinationName,
  getMoveItemsTitle,
  getSourcePaths,
  isSameAsSourcePath,
} from './MoveItemsModal.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

interface MoveItemsModalProps {
  projectRef: string
  bucketId: string
  bucketName: string
  visible: boolean
  selectedItemsToMove: StorageItemWithColumn[]
  openedFolders: readonly StorageItem[]
  onSelectCancel: () => void
  onSelectMove: (path: string) => void
}

const MoveItemsDialogBody = ({
  projectRef,
  bucketId,
  bucketName,
  selectedItemsToMove,
  openedFolders,
  onSelectCancel,
  onSelectMove,
}: Omit<MoveItemsModalProps, 'visible'>) => {
  const [isMoving, setIsMoving] = useState(false)
  const [pathSegments, setPathSegments] = useState<string[]>([])

  const destinationPath = pathSegments.join('/')
  const destinationName = getDestinationName(bucketName, pathSegments)
  const sourcePaths = getSourcePaths(selectedItemsToMove, openedFolders)
  const isAlreadyInDestination = isSameAsSourcePath(sourcePaths, destinationPath)

  const handleMove = () => {
    setIsMoving(true)
    onSelectMove(destinationPath)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{getMoveItemsTitle(selectedItemsToMove)}</DialogTitle>
        <DialogDescription>Select a destination folder in {bucketName}.</DialogDescription>
      </DialogHeader>
      <DialogSectionSeparator />
      <DialogSection>
        <MoveItemsFolderPicker
          projectRef={projectRef}
          bucketId={bucketId}
          bucketName={bucketName}
          pathSegments={pathSegments}
          onChangePath={setPathSegments}
        />
      </DialogSection>
      <DialogFooter className="gap-y-2">
        <Button disabled={isMoving} onClick={onSelectCancel}>
          Cancel
        </Button>
        <ButtonTooltip
          variant="primary"
          loading={isMoving}
          disabled={isAlreadyInDestination}
          onClick={handleMove}
          tooltip={{
            content: {
              side: 'bottom',
              text: isAlreadyInDestination ? `Already in ${destinationName}` : undefined,
            },
          }}
        >
          {isMoving ? `Moving to ${destinationName}...` : `Move to ${destinationName}`}
        </ButtonTooltip>
      </DialogFooter>
    </>
  )
}

export const MoveItemsModal = ({ visible, ...props }: MoveItemsModalProps) => {
  return (
    <Dialog open={visible} onOpenChange={props.onSelectCancel}>
      <DialogContent size="xlarge">
        <MoveItemsDialogBody {...props} />
      </DialogContent>
    </Dialog>
  )
}
