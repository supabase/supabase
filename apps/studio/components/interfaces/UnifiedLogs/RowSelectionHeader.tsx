import { AnimatePresence, motion } from 'framer-motion'
import { Copy, X } from 'lucide-react'
import { toast } from 'sonner'
import {
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
import { ShortcutBadge } from '@/components/ui/ShortcutBadge'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'
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
        `Copied ${selectedRows.length} log${selectedRows.length !== 1 ? 's' : ''} as ${format === 'json' ? format.toUpperCase() : format}`
      )
    })
  }

  const hasSelection = selectedRows.length > 0
  useShortcut(SHORTCUT_IDS.RESULTS_COPY_JSON, () => onCopy('json'), {
    enabled: hasSelection,
    registerInCommandMenu: true,
  })
  useShortcut(SHORTCUT_IDS.RESULTS_COPY_MARKDOWN, () => onCopy('markdown'), {
    enabled: hasSelection,
    registerInCommandMenu: true,
  })

  return (
    <div className="relative">
      <AnimatePresence>
        {selectedRows.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '36px', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 30,
              mass: 0.4,
            }}
            className="pl-4 pr-2 flex items-center justify-between border-t absolute top-0 z-2 bg-surface-75 w-full"
            style={{ overflow: 'hidden' }}
          >
            <p className="text-xs">
              {selectedRows.length} row{selectedRows.length > 1 ? 's' : ''} selected
            </p>

            <div className="flex items-center justify-center gap-x-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <ButtonTooltip
                    variant="default"
                    size="tiny"
                    icon={<Copy size={12} />}
                    className="w-7"
                    tooltip={{ content: { side: 'bottom', text: 'Copy selected logs' } }}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => onCopy('json')} className="gap-2 text-xs">
                    <Copy size={13} />
                    Copy as JSON
                    <ShortcutBadge
                      shortcutId={SHORTCUT_IDS.RESULTS_COPY_JSON}
                      className="ml-auto"
                    />
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCopy('markdown')} className="gap-2 text-xs">
                    <Copy size={13} />
                    Copy as Markdown
                    <ShortcutBadge
                      shortcutId={SHORTCUT_IDS.RESULTS_COPY_MARKDOWN}
                      className="ml-auto"
                    />
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
    </div>
  )
}
