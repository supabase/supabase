import { Button, IconDownload, IconTrash2, IconMove, IconX } from '@supabase/ui'

const FileExplorerHeaderSelection = ({
  selectedItems = [],
  onSelectItemsDownload = () => {},
  onSelectItemsDelete = () => {},
  onSelectItemsMove = () => {},
  onUnselectAllItems = () => {},
}) => {
  return (
    <div className="px-1 py-1 rounded-t-md bg-green-600 flex items-center shadow z-10 h-[40px]">
      <Button
        icon={<IconX size={16} strokeWidth={2} />}
        type="text"
        shadow={false}
        onClick={onUnselectAllItems}
      />
      <div className="flex items-center space-x-3 ml-4">
        <p className="text-sm text-white mb-0">
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{selectedItems.length}</span> items
          selected
        </p>
        {/* [Joshen] Disabled multi download for now */}
        <Button
          icon={<IconDownload size={16} strokeWidth={2} />}
          type="primary"
          shadow={false}
          onClick={onSelectItemsDownload}
        >
          Download
        </Button>
        <div className="border-r border-green-800 py-3 opacity-50" />
        <Button
          icon={<IconTrash2 size={16} strokeWidth={2} />}
          type="primary"
          shadow={false}
          onClick={onSelectItemsDelete}
        >
          Delete
        </Button>
        <Button
          icon={<IconMove size={16} strokeWidth={2} />}
          type="primary"
          shadow={false}
          onClick={onSelectItemsMove}
        >
          Move
        </Button>
      </div>
    </div>
  )
}

export default FileExplorerHeaderSelection
