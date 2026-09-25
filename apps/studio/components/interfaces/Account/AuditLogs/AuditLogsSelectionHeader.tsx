import type { Table } from '@tanstack/react-table'
import { AnimatePresence, motion } from 'framer-motion'
import { Copy, X } from 'lucide-react'
import { toast } from 'sonner'
import { copyToClipboard } from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import type { AuditLog } from '@/data/organizations/organization-audit-logs-query'

interface AuditLogsSelectionHeaderProps {
  table: Table<AuditLog>
}

export const AuditLogsSelectionHeader = ({ table }: AuditLogsSelectionHeaderProps) => {
  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original)
  const hasSelection = selectedRows.length > 0

  const handleCopy = () => {
    const text = JSON.stringify(selectedRows, null, 2)
    copyToClipboard(text, () => {
      toast.success(`Copied ${selectedRows.length} log${selectedRows.length !== 1 ? 's' : ''}`)
    })
  }

  return (
    <AnimatePresence>
      {hasSelection && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: '40px', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.4 }}
          className="px-10 flex items-center justify-between border-b bg-surface-75 w-full overflow-hidden absolute top-0 left-0 right-0 z-20"
        >
          <p className="text-xs">
            {selectedRows.length} row{selectedRows.length > 1 ? 's' : ''} selected
          </p>

          <div className="flex items-center justify-center gap-x-2">
            <ButtonTooltip
              size="tiny"
              icon={<Copy size={12} />}
              className="w-7"
              onClick={handleCopy}
              tooltip={{ content: { side: 'bottom', text: 'Copy selected logs' } }}
            />
            <ButtonTooltip
              size="tiny"
              variant="text"
              icon={<X />}
              className="px-1"
              onClick={() => table.resetRowSelection()}
              tooltip={{ content: { side: 'bottom', text: 'Clear selection' } }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
