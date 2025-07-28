import { noop } from 'lodash'
import { useEffect, useState } from 'react'

import { Button, Input, Modal } from 'ui'
import { StorageItemWithColumn } from '../Storage.types'

interface MoveItemsModalProps {
  bucketName: string
  visible: boolean
  selectedItemsToMove: StorageItemWithColumn[]
  onSelectCancel: () => void
  onSelectMove: (path: string) => void
}

const MoveItemsModal = ({
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
    <Modal
      visible={visible}
      header={title}
      description={description}
      size="medium"
      onCancel={onSelectCancel}
      customFooter={
        <div className="flex items-center gap-2">
          <Button type="default" onClick={onSelectCancel}>
            Cancel
          </Button>
          <Button type="primary" loading={moving} onClick={onConfirmMove}>
            {moving ? 'Moving files' : 'Move files'}
          </Button>
        </div>
      }
    >
      <Modal.Content>
        <form>
          <div className="relative flex items-center">
            <Input
              autoFocus
              label={`Path to new directory in ${bucketName}`}
              type="text"
              className="w-full"
              placeholder="e.g folder1/subfolder2"
              value={newPath}
              descriptionText="Leave blank to move items to the root of the bucket"
              onChange={(event) => setNewPath(event.target.value)}
            />
          </div>

          <button className="hidden" type="submit" onClick={onConfirmMove} />
        </form>
      </Modal.Content>
    </Modal>
  )
}

export default MoveItemsModal
