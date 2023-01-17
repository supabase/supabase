import { Menu, Item, Separator, Submenu } from 'react-contexify'
import 'react-contexify/dist/ReactContexify.css'
import { IconClipboard, IconEdit, IconMove, IconDownload, IconTrash2, IconChevronRight } from 'ui'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { observer } from 'mobx-react-lite'

const ItemContextMenu = ({ id = '' }) => {
  const storageExplorerStore = useStorageStore()
  const {
    downloadFile,
    selectedBucket,
    setSelectedItemsToDelete,
    setSelectedItemToRename,
    setSelectedItemsToMove,
    setSelectedFileCustomExpiry,
    copyFileURLToClipboard,
  } = storageExplorerStore
  const isPublic = selectedBucket.public

  const onHandleClick = async (event, item, expiresIn) => {
    if (item.isCorrupted) return
    switch (event) {
      case 'copy':
        if (expiresIn < 0) return setSelectedFileCustomExpiry(item)
        else return await copyFileURLToClipboard(item, expiresIn)
      case 'rename':
        return setSelectedItemToRename(item)
      case 'move':
        return setSelectedItemsToMove([item])
      case 'download':
        return await downloadFile(item)
      default:
        break
    }
  }

  return (
    <Menu id={id} animation="fade" className="!bg-scale-300 border border-scale-500">
      {isPublic ? (
        <Item onClick={({ props }) => onHandleClick('copy', props.item)}>
          <IconClipboard size="tiny" />
          <span className="ml-2 text-xs">Copy URL</span>
        </Item>
      ) : (
        <Submenu
          label={
            <div className="flex items-center space-x-2">
              <IconClipboard size="tiny" />
              <span className="text-xs">Copy URL</span>
            </div>
          }
          arrow={<IconChevronRight size="tiny" />}
        >
          <Item onClick={({ props }) => onHandleClick('copy', props.item, 60 * 60 * 24 * 7)}>
            <span className="ml-2 text-xs">Expire in 1 week</span>
          </Item>
          <Item onClick={({ props }) => onHandleClick('copy', props.item, 60 * 60 * 24 * 30)}>
            <span className="ml-2 text-xs">Expire in 1 month</span>
          </Item>
          <Item onClick={({ props }) => onHandleClick('copy', props.item, 60 * 60 * 24 * 365)}>
            <span className="ml-2 text-xs">Expire in 1 year</span>
          </Item>
          <Item onClick={({ props }) => onHandleClick('copy', props.item, -1)}>
            <span className="ml-2 text-xs">Custom expiry</span>
          </Item>
        </Submenu>
      )}
      <Item onClick={({ props }) => onHandleClick('rename', props.item)}>
        <IconEdit size="tiny" />
        <span className="ml-2 text-xs">Rename</span>
      </Item>
      <Item onClick={({ props }) => onHandleClick('move', props.item)}>
        <IconMove size="tiny" />
        <span className="ml-2 text-xs">Move</span>
      </Item>
      <Item onClick={({ props }) => onHandleClick('download', props.item)}>
        <IconDownload size="tiny" />
        <span className="ml-2 text-xs">Download</span>
      </Item>
      <Separator />
      <Item onClick={({ props }) => setSelectedItemsToDelete([props.item])}>
        <IconTrash2 size="tiny" />
        <span className="ml-2 text-xs">Delete</span>
      </Item>
    </Menu>
  )
}

export default observer(ItemContextMenu)
