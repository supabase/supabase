import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Copy, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Button,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import { type LogData } from '../Settings/Logs/Logs.types'
import {
  buildLogsPrompt,
  formatLogsAsJson,
  formatLogsAsMarkdown,
} from '../Settings/Logs/Logs.utils'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from '@/components/ui/AiAssistantDropdown'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useDataTable } from '@/components/ui/DataTable/providers/DataTableProvider'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

// TODO - format Logs as JSON, as markdown, and as prompt

export const RowSelectionHeader = () => {
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()

  const { table } = useDataTable()
  const selectedRows = table.getSelectedRowModel().rows.map((x) => x.original) as LogData[]

  const handleOpenAiAssistant = () => {
    const prompt = buildLogsPrompt(selectedRows)
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    aiSnap.newChat({ initialMessage: prompt })
  }

  const onCopy = (format: 'json' | 'markdown') => {
    const text =
      format === 'json' ? formatLogsAsJson(selectedRows) : formatLogsAsMarkdown(selectedRows)
    copyToClipboard(text, () => {
      toast.success(
        `Copied ${selectedRows.length} log${selectedRows.length !== 1 ? 's' : ''} as ${format.toUpperCase()}`
      )
    })
  }

  return (
    <AnimatePresence>
      {selectedRows.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: '40px', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 420,
            damping: 30,
            mass: 0.4,
          }}
          className="pl-4 pr-2 flex items-center justify-between border-y"
          style={{ overflow: 'hidden' }}
        >
          <p className="text-xs">
            {selectedRows.length} row{selectedRows.length > 1 ? 's' : ''} selected
          </p>

          <div className="flex items-center justify-center gap-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="default"
                  size="tiny"
                  icon={<Copy size={12} />}
                  iconRight={<ChevronDown size={11} />}
                >
                  Copy
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onCopy('json')} className="gap-2 text-xs">
                  <Copy size={13} />
                  Copy as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopy('markdown')} className="gap-2 text-xs">
                  <Copy size={13} />
                  Copy as Markdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AiAssistantDropdown
              label="Explain with AI"
              buildPrompt={() => buildLogsPrompt(selectedRows)}
              onOpenAssistant={handleOpenAiAssistant}
              telemetrySource="log_explorer"
            />

            <ButtonTooltip
              type="text"
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
