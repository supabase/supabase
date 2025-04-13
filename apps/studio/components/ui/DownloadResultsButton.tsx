import { ChevronDown, Clipboard, Download } from 'lucide-react'
import { markdownTable } from 'markdown-table'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { copyToClipboard } from 'lib/helpers'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

interface DownloadResultsButtonProps {
  type?: 'text' | 'default'
  align?: 'start' | 'center' | 'end'
  results: any[]
  fileName: string
  onDownloadAsCSV?: () => void
  onCopyAsMarkdown?: () => void
  onCopyAsJSON?: () => void
}

export const DownloadResultsButton = ({
  type = 'default',
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

  // --- New CSV generation/download, without react-csv ---

  const escapeCsvValue = (value: any): string => {
    const stringValue = String(value)
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  const generateCSV = (headers: string[], data: any[]): string => {
    const headerLine = headers.map(escapeCsvValue).join(',')
    const dataLines = data.map((row) =>
      headers.map((key) => escapeCsvValue(row[key] ?? '')).join(',')
    )
    return [headerLine, ...dataLines].join('\n')
  }

  const downloadCSV = (csv: string, fileName: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }


  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type={type} iconRight={<ChevronDown />} disabled={results.length === 0}>
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-44">
          <DropdownMenuItem
            className="gap-x-2"
            onClick={() => {
              console.log('Formatted CSV data:', formattedResults)
              const csvString = generateCSV(headers || [], formattedResults)
              downloadCSV(csvString, `${fileName}.csv`)
              toast.success('Downloading results as CSV')
              onDownloadAsCSV?.()
            }}
          >
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
    </>
  )
}
