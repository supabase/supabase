import saveAs from 'file-saver'
import { ChevronDown, Clipboard, Download } from 'lucide-react'
import { markdownTable } from 'markdown-table'
import Papa from 'papaparse'
import { useMemo } from 'react'
import { toast } from 'sonner'

import {
  Button,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

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
  // [Joshen] Ensure JSON values are stringified for CSV and Markdown
  const formattedResults = results.map((row) => {
    const r = { ...row }
    Object.keys(row).forEach((x) => {
      if (typeof row[x] === 'object') r[x] = JSON.stringify(row[x])
    })
    return r
  })

  const headers = useMemo(() => {
    if (results) {
      const firstRow = Array.from(results)[0]
      if (firstRow) return Object.keys(firstRow)
    }
    return undefined
  }, [results])

  const downloadAsCSV = () => {
    const csv = Papa.unparse(formattedResults, { columns: headers })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `${fileName}.csv`)
    toast.success('Downloading results as CSV')
    onDownloadAsCSV?.()
  }

  const copyAsMarkdown = () => {
    if (navigator) {
      if (formattedResults.length == 0) toast('Results are empty')

      const columns = Object.keys(formattedResults[0])
      const rows = formattedResults.map((x) => {
        let temp: any[] = []
        columns.forEach((col) => temp.push(x[col]))
        return temp
      })
      const table = [columns].concat(rows)
      const markdownData = markdownTable(table)

      copyToClipboard(markdownData, () => {
        toast.success('Copied results to clipboard')
        onCopyAsMarkdown?.()
      })
    }
  }

  const copyAsJSON = () => {
    if (navigator) {
      if (results.length === 0) return toast('Results are empty')
      copyToClipboard(JSON.stringify(results, null, 2), () => {
        toast.success('Copied results to clipboard')
        onCopyAsJSON?.()
      })
    }
  }

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
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuItem className="gap-x-2" onClick={() => downloadAsCSV()}>
          <Download size={14} />
          <p>Download CSV</p>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyAsMarkdown} className="gap-x-2">
          <Clipboard size={14} />
          <p>Copy as markdown</p>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyAsJSON} className="gap-x-2">
          <Clipboard size={14} />
          <p>Copy as JSON</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
