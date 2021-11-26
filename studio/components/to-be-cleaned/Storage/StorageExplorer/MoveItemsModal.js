import { useEffect, useState } from 'react'
import { Modal, Button, Input, Space, Typography } from '@supabase/ui'

const MoveItemsModal = ({
  bucketName = '',
  visible = false,
  selectedItemsToMove = [],
  onSelectCancel = () => {},
  onSelectMove = () => {},
}) => {
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
    ? `Moving ${selectedItemsToMove[0].name} within ${bucketName}`
    : ``

  const description = `Enter the path to where you'd like to move the file${
    multipleFiles ? 's' : ''
  } to.`

  const onConfirmMove = (event) => {
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
      title={title}
      description={description}
      size="large"
      customFooter={
        <Space>
          <Button type="secondary" onClick={onSelectCancel}>
            Cancel
          </Button>
          <Button type="primary" loading={moving} onClick={onConfirmMove}>
            {moving ? 'Moving files' : 'Move files'}
          </Button>
        </Space>
      }
    >
      <div className="space-y-4 w-full pb-3">
        <form>
          <p className="mb-2">
            <Typography.Text>Path to new directory in {bucketName}:</Typography.Text>
          </p>
          <div className="flex items-center relative">
            <Input
              autoFocus
              type="text"
              className="w-full"
              placeholder="e.g folder1/subfolder2"
              value={newPath}
              onChange={(event) => setNewPath(event.target.value)}
            />
          </div>
          <p className="opacity-50 mt-2">
            <Typography.Text>Leave blank to move items to the root of the bucket</Typography.Text>
          </p>
          <button className="hidden" type="submit" onClick={onConfirmMove} />
        </form>
      </div>
    </Modal>
  )
}

export default MoveItemsModal
