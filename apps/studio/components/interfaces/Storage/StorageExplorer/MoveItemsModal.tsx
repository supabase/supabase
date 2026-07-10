import { noop } from 'lodash'
import { useEffect, useState } from 'react'
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
  Input,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { StorageItemWithColumn } from '../Storage.types'

interface MoveItemsModalProps {
  bucketName: string
  visible: boolean
  selectedItemsToMove: StorageItemWithColumn[]
  onSelectCancel: () => void
  onSelectMove: (path: string) => void
}

export const MoveItemsModal = ({
  bucketName = '',
  visible = false,
  selectedItemsToMove = [],
  onSelectCancel = noop,
  onSelectMove = noop,
}: MoveItemsModalProps) => {
  const [moving, setMoving] = useState(false)
  const [newPath, setNewPath] = useState('')

  useEffect(() => {
    setMoving(false)
    setNewPath('')
  }, [visible])

  const multipleFiles = selectedItemsToMove.length > 1

  const title = multipleFiles
    ? `Moving ${selectedItemsToMove.length} items within ${bucketName}`
    : selectedItemsToMove.length === 1
      ? `Moving ${selectedItemsToMove[0]?.name} within ${bucketName}`
      : ``

  const description = `Enter the path to where you'd like to move the file${
    multipleFiles ? 's' : ''
  } to.`

  const onConfirmMove = (event: any) => {
    if (event) {
      event.preventDefault()
    }
    setMoving(true)
    const formattedPath = newPath[0] === '/' ? newPath.slice(1) : newPath
    onSelectMove(formattedPath)
  }

  return (
    <Dialog open={visible} onOpenChange={onSelectCancel}>
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <form>
            <FormItemLayout
              label={`Path to new directory in ${bucketName}`}
              description="Leave blank to move items to the root of the bucket"
              layout="vertical"
              isReactForm={false}
            >
              <Input
                autoFocus
                type="text"
                placeholder="e.g folder1/subfolder2"
                value={newPath}
                onChange={(event) => setNewPath(event.target.value)}
              />
            </FormItemLayout>

            <button className="hidden" type="submit" onClick={onConfirmMove} />
          </form>
        </DialogSection>
        <DialogFooter>
          <Button variant="default" onClick={onSelectCancel}>
            Cancel
          </Button>
          <Button variant="primary" loading={moving} onClick={onConfirmMove}>
            {moving ? 'Moving files' : 'Move files'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
