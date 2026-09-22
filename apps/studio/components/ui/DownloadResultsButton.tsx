import { IS_PLATFORM, useParams } from 'common'
import saveAs from 'file-saver'
import { ChevronDown, Copy, Download, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { toast } from 'sonner'
import {
  Button,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  KeyboardShortcut,
} from 'ui'

import { ButtonTooltip } from './ButtonTooltip'
import {
  convertResultsToCSV,
  convertResultsToJSON,
  convertResultsToMarkdown,
} from '@/components/interfaces/SQLEditor/UtilityPanel/Results.utils'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface DownloadResultsButtonProps {
  iconOnly?: boolean
  variant?: 'text' | 'default'
  text?: string
  align?: 'start' | 'center' | 'end'
  results: readonly any[]
  fileName: string
  enableCopyShortcuts?: boolean
  onDownloadAsCSV?: () => void
  onCopyAsMarkdown?: () => void
  onCopyAsJSON?: () => void
  onCopyAsCSV?: () => void
}

export const DownloadResultsButton = ({
  iconOnly = false,
  variant = 'default',
  text = 'Export',
  align = 'start',
  results,
  fileName,
  enableCopyShortcuts = true,
  onDownloadAsCSV,
  onCopyAsMarkdown,
  onCopyAsJSON,
  onCopyAsCSV,
}: DownloadResultsButtonProps) => {
  const { ref } = useParams()
  const pathname = usePathname()
  const isLogs = pathname?.includes?.('/logs') ?? false
  const isEmpty = useMemo(() => results.length === 0, [results])

  const downloadAsCSV = () => {
    const csv = convertResultsToCSV(results)
    if (!csv) {
      toast('Results are empty')
      return
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `${fileName}.csv`)
    toast.success('Downloading results as CSV')
    onDownloadAsCSV?.()
  }

  const copyAsMarkdown = () => {
    const markdownData = convertResultsToMarkdown(results)
    if (!markdownData) {
      toast('Results are empty')
      return
    }
    copyToClipboard(markdownData, () => {
      toast.success('Copied Markdown to clipboard')
      onCopyAsMarkdown?.()
    })
  }

  const copyAsJSON = () => {
    const jsonData = convertResultsToJSON(results)
    if (!jsonData) {
      toast('Results are empty')
      return
    }
    copyToClipboard(jsonData, () => {
      toast.success('Copied JSON to clipboard')
      onCopyAsJSON?.()
    })
  }

  const copyAsCSV = () => {
    const csv = convertResultsToCSV(results)
    if (!csv) {
      toast('Results are empty')
      return
    }
    copyToClipboard(csv, () => {
      toast.success('Copied CSV to clipboard')
      onCopyAsCSV?.()
    })
  }

  useShortcut(SHORTCUT_IDS.RESULTS_COPY_MARKDOWN, copyAsMarkdown, {
    enabled: !isEmpty && enableCopyShortcuts,
    conflictBehavior: 'allow',
    registerInCommandMenu: true,
  })
  useShortcut(SHORTCUT_IDS.RESULTS_COPY_JSON, copyAsJSON, {
    enabled: !isEmpty && enableCopyShortcuts,
    conflictBehavior: 'allow',
    registerInCommandMenu: true,
  })
  useShortcut(SHORTCUT_IDS.RESULTS_COPY_CSV, copyAsCSV, {
    enabled: !isEmpty && enableCopyShortcuts,
    conflictBehavior: 'allow',
    registerInCommandMenu: true,
  })
  useShortcut(SHORTCUT_IDS.RESULTS_DOWNLOAD_CSV, downloadAsCSV, {
    enabled: !isEmpty,
    registerInCommandMenu: true,
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {iconOnly ? (
          <ButtonTooltip
            variant={variant}
            aria-label="Download results"
            aria-describedby={undefined}
            icon={<Download />}
            disabled={results.length === 0}
            className="w-7"
            tooltip={{ content: { side: 'bottom', text: 'Download results' } }}
          />
        ) : (
          <Button variant={variant} iconRight={<ChevronDown />} disabled={results.length === 0}>
            {text}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={enableCopyShortcuts ? 'w-60' : 'w-44'}>
        {isLogs && IS_PLATFORM && (
          <DropdownMenuItem asChild className="gap-x-2">
            <Link href={`/project/${ref}/settings/log-drains`}>
              <Settings size={14} />
              <p>Add a Log Drain</p>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={copyAsMarkdown} className="gap-x-2">
          <Copy size={14} />
          <p>Copy as Markdown</p>
          {enableCopyShortcuts && (
            <span className="ml-auto">
              <KeyboardShortcut keys={['Shift', 'Meta', 'm']} />
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyAsJSON} className="gap-x-2">
          <Copy size={14} />
          <p>Copy as JSON</p>
          {enableCopyShortcuts && (
            <span className="ml-auto">
              <KeyboardShortcut keys={['Shift', 'Meta', 'j']} />
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyAsCSV} className="gap-x-2">
          <Copy size={14} />
          <p>Copy as CSV</p>
          {enableCopyShortcuts && (
            <span className="ml-auto">
              <KeyboardShortcut keys={['Shift', 'Meta', 'c']} />
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-x-2" onClick={() => downloadAsCSV()}>
          <Download size={14} />
          <p>Download CSV</p>
          {enableCopyShortcuts && (
            <span className="ml-auto">
              <KeyboardShortcut keys={['Shift', 'Meta', 'd']} />
            </span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
