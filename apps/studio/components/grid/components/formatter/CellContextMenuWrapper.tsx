import { ContextMenuContent } from '@ui/components/shadcn/ui/context-menu'
import { Copy } from 'lucide-react'
import { PropsWithChildren } from 'react'
import { toast } from 'sonner'
import {
  ContextMenu_Shadcn_,
  ContextMenuItem_Shadcn_,
  ContextMenuTrigger_Shadcn_,
} from 'ui'

import { formatClipboardValue, writeTextToClipboard } from '../../utils/common'

/**
 * [Joshen] RowRenderer should be using this so that we can deprecate `react-contextify`
 * We can probably extend this for all the other actions like edit, delete, etc
 */
export const CellContextMenuWrapper = ({
  value,
  children,
}: PropsWithChildren<{ value: string | number | boolean | object | null }>) => {
  const onCopyCellContent = () => {
    const text = formatClipboardValue(value)
    void writeTextToClipboard(text).then((isCopied) => {
      if (isCopied) toast.success('Copied cell value to clipboard')
      else toast.error('Failed to copy cell value')
    })
  }

  return (
    <ContextMenu_Shadcn_>
      <ContextMenuTrigger_Shadcn_ className="flex items-center w-full">
        {children}
      </ContextMenuTrigger_Shadcn_>
      <ContextMenuContent>
        <ContextMenuItem_Shadcn_ className="gap-x-2" onSelect={onCopyCellContent}>
          <Copy size={12} />
          <span className="text-xs">Copy cell</span>
        </ContextMenuItem_Shadcn_>
      </ContextMenuContent>
    </ContextMenu_Shadcn_>
  )
}
