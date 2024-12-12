import { compact, isObject, isString, map } from 'lodash'
import { ChevronDownIcon, Clipboard, Download } from 'lucide-react'
import { markdownTable } from 'markdown-table'
import { useMemo, useRef } from 'react'
import { CSVLink } from 'react-csv'
import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { copyToClipboard } from 'lib/helpers'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { TelemetryActions } from 'lib/constants/telemetry'

export type ResultsDropdownProps = {
  id: string
}

const ResultsDropdown = ({ id }: ResultsDropdownProps) => {
  const { project } = useProjectContext()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const result = snapV2.results?.[id]?.[0] ?? undefined
  const csvRef = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null)

  const { mutate: sendEvent } = useSendEventMutation()

  const csvData = useMemo(() => {
    if (result?.rows) {
      const rows = Array.from(result.rows || []).map((row) => {
        return map(row, (v, k) => {
          if (isString(v)) {
            // replace all newlines with the character \n
            // escape all quotation marks
            return v.replaceAll(/\n/g, '\\n').replaceAll(/"/g, '""')
          }
          if (isObject(v)) {
            // replace all quotation marks with two quotation marks to escape them.
            return JSON.stringify(v).replaceAll(/\"/g, '""')
          }
          return v
        })
      })

      return compact(rows)
    }
    return ''
  }, [result])

  const headers = useMemo(() => {
    if (result?.rows) {
      const firstRow = Array.from(result.rows || [])[0]
      if (firstRow) {
        return Object.keys(firstRow)
      }
    }
    // if undefined is returned no headers will be set. In this case, no headers would be better
    // than malformed headers.
    return undefined
  }, [result])

  function onDownloadCSV() {
    csvRef.current?.link.click()
    sendEvent({ action: TelemetryActions.SQL_EDITOR_RESULT_DOWNLOAD_CSV_CLICKED })
  }

  function onCopyAsMarkdown() {
    if (navigator) {
      if (!result || !result.rows) return 'results is empty'
      if (result.rows.constructor !== Array && !!result.error) return result.error
      if (result.rows.length == 0) return 'results is empty'

      const columns = Object.keys(result.rows[0])
      const rows = result.rows.map((x) => {
        let temp: any[] = []
        columns.forEach((col) => temp.push(x[col]))
        return temp
      })
      const table = [columns].concat(rows)
      const markdownData = markdownTable(table)

      copyToClipboard(markdownData, () => {
        toast.success('Copied results to clipboard')
        sendEvent({ action: TelemetryActions.SQL_EDITOR_RESULT_COPY_MARKDOWN_CLICKED })
      })
    }
  }

  function onCopyAsJSON() {
    if (navigator) {
      if (!result || !result.rows) return 'results is empty'
      if (result.rows.constructor !== Array && !!result.error) return result.error
      if (result.rows.length == 0) return 'results is empty'

      copyToClipboard(JSON.stringify(result.rows, null, 2), () => {
        toast.success('Copied results to clipboard')
        sendEvent({ action: TelemetryActions.SQL_EDITOR_RESULT_COPY_JSON_CLICKED })
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="text" iconRight={<ChevronDownIcon size={14} />}>
          Export
        </Button>
      </DropdownMenuTrigger>

      <CSVLink
        ref={csvRef}
        className="hidden"
        headers={headers}
        data={csvData}
        filename={`supabase_${project?.ref}_${snapV2.snippets[id]?.snippet.name}.csv`}
      />

      <DropdownMenuContent side="bottom" align="start">
        <DropdownMenuItem onClick={onDownloadCSV} className="space-x-2">
          <Download size={14} />
          <p>Download CSV</p>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopyAsMarkdown} className="space-x-2">
          <Clipboard size={14} />
          <p>Copy as markdown</p>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopyAsJSON} className="space-x-2">
          <Clipboard size={14} />
          <p>Copy as JSON</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ResultsDropdown
