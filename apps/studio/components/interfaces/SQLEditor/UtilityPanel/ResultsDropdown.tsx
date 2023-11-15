import { useTelemetryProps } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useStore } from 'hooks'
import { copyToClipboard } from 'lib/helpers'
import Telemetry from 'lib/telemetry'
import { compact, isObject, isString, map } from 'lodash'
import { useRouter } from 'next/router'
import { useMemo, useRef } from 'react'
import { CSVLink } from 'react-csv'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconChevronDown,
  IconClipboard,
  IconDownload,
} from 'ui'
// @ts-ignore
import MarkdownTable from 'markdown-table'

export type ResultsDropdownProps = {
  id: string
  isExecuting?: boolean
}

const ResultsDropdown = ({ id, isExecuting }: ResultsDropdownProps) => {
  const { project } = useProjectContext()
  const snap = useSqlEditorStateSnapshot()
  const telemetryProps = useTelemetryProps()
  const result = snap.results?.[id]?.[0] ?? undefined
  const { ui } = useStore()
  const csvRef = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null)
  const router = useRouter()

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
    Telemetry.sendEvent(
      { category: 'sql_editor', action: 'sql_download_csv', label: '' },
      telemetryProps,
      router
    )
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
      const markdownData = MarkdownTable(table)

      copyToClipboard(markdownData, () => {
        ui.setNotification({ category: 'success', message: 'Copied results to clipboard' })
        Telemetry.sendEvent(
          { category: 'sql_editor', action: 'sql_copy_as_markdown', label: '' },
          telemetryProps,
          router
        )
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button asChild type="text" iconRight={<IconChevronDown />}>
          <span>
            Results
            {!isExecuting &&
              result &&
              result.rows.length > 0 &&
              ` (${result.rows.length.toLocaleString()})`}
          </span>
        </Button>
        <CSVLink
          ref={csvRef}
          className="hidden"
          headers={headers}
          data={csvData}
          filename={`supabase_${project?.ref}_${snap.snippets[id]?.snippet.name}`}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start">
        <>
          <DropdownMenuItem onClick={onDownloadCSV} className="space-x-2">
            <IconDownload size="tiny" />
            <p>Download CSV</p>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onCopyAsMarkdown} className="space-x-2">
            <IconClipboard size="tiny" />
            <p>Copy as markdown</p>
          </DropdownMenuItem>
        </>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ResultsDropdown
