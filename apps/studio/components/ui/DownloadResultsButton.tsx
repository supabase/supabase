import { ChevronDown, Clipboard, Download } from 'lucide-react'
import { markdownTable } from 'markdown-table'
import { useMemo, useRef } from 'react'
import { CSVLink } from 'react-csv'
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
  onCopyAsMarkdown?: () => void
  onCopyAsJSON?: () => void
}

export const DownloadResultsButton = ({
  type = 'default',
  align = 'start',
  results,
  fileName,
  onCopyAsMarkdown,
  onCopyAsJSON,
}: DownloadResultsButtonProps) => {
  const csvRef = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null)

  const headers = useMemo(() => {
    if (results) {
      const firstRow = Array.from(results)[0]
      if (firstRow) return Object.keys(firstRow)
    }
    return undefined
  }, [results])

  const copyAsMarkdown = () => {
    if (navigator) {
      if (results.length == 0) toast('Results are empty')

      const columns = Object.keys(results[0])
      const rows = results.map((x) => {
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type={type} iconRight={<ChevronDown />} disabled={results.length === 0}>
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-44">
          <DropdownMenuItem className="gap-x-2" onClick={() => csvRef.current?.link.click()}>
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
      <CSVLink
        ref={csvRef}
        className="hidden"
        headers={headers}
        data={results}
        filename={`${fileName}.csv`}
      />
    </>
  )
}
