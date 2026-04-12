import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useParams } from 'common'
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

import {
  convertResultsToCSV,
  convertResultsToJSON,
  convertResultsToMarkdown,
} from '@/components/interfaces/SQLEditor/UtilityPanel/Results.utils'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useHotKey } from '@/hooks/ui/useHotKey'

interface DownloadResultsButtonProps {
  iconOnly?: boolean
  type?: 'text' | 'default'
  text?: string
  align?: 'start' | 'center' | 'end'
  results: any[]
  fileName: string
  onDownloadAsCSV?: () => void
  onCopyAsMarkdown?: () => void
  onCopyAsJSON?: () => void
}

export const DownloadResultsButton = ({
  iconOnly = false,
  type = 'default',
  text = 'Export',
  align = 'start',
  results,
  fileName,
  onDownloadAsCSV,
  onCopyAsMarkdown,
  onCopyAsJSON,
}: DownloadResultsButtonProps) => {
  const { ref } = useParams()
  const pathname = usePathname()
  const isLogs = pathname?.includes?.('/logs') ?? false
  const [copyMarkdownEnabled] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.HOTKEY_COPY_MARKDOWN, true)
  const [copyJsonEnabled] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.HOTKEY_COPY_JSON, true)
  const [downloadCsvEnabled] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.HOTKEY_DOWNLOAD_CSV, true)

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
      toast.success('Copied markdown to clipboard')
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

  useHotKey(
    (e) => {
      e.preventDefault()
      copyAsMarkdown()
    },
    'm',
    { enabled: copyMarkdownEnabled ?? isEmpty, shift: true }
  )

  useHotKey(
    (e) => {
      e.preventDefault()
      copyAsJSON()
    },
    'j',
    { enabled: copyJsonEnabled ?? isEmpty, shift: true }
  )

  useHotKey(
    (e) => {
      e.preventDefault()
      downloadAsCSV()
    },
    'd',
    { enabled: downloadCsvEnabled ?? isEmpty, shift: true }
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type={type}
          icon={iconOnly ? <Download /> : undefined}
          iconRight={iconOnly ? undefined : <ChevronDown />}
          disabled={results.length === 0}
          className={iconOnly ? 'w-7' : ''}
        >
          {!iconOnly && text}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-60">
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
          <span className="ml-auto">
            <KeyboardShortcut keys={['Shift', 'Meta', 'm']} />
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyAsJSON} className="gap-x-2">
          <Copy size={14} />
          <p>Copy as JSON</p>
          <span className="ml-auto">
            <KeyboardShortcut keys={['Shift', 'Meta', 'j']} />
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-x-2" onClick={() => downloadAsCSV()}>
          <Download size={14} />
          <p>Download CSV</p>
          <span className="ml-auto">
            <KeyboardShortcut keys={['Shift', 'Meta', 'd']} />
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
