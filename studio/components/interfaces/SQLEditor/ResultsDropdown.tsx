import { Button, Dropdown, IconChevronDown } from '@supabase/ui'
import { useProjectContext } from 'data/projects/ProjectContext'
import { useStore } from 'hooks'
import { copyToClipboard } from 'lib/helpers'
import Telemetry from 'lib/telemetry'
import { compact } from 'lodash'
import MarkdownTable from 'markdown-table'
import { useMemo, useRef } from 'react'
import { CSVLink } from 'react-csv'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'

export type ResultsDropdownProps = {
  id: string
}

const ResultsDropdown = ({ id }: ResultsDropdownProps) => {
  const { project } = useProjectContext()
  const snap = useSqlEditorStateSnapshot()
  const result = snap.results[id][0]
  const { ui } = useStore()
  const csvRef = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null)

  const csvData = useMemo(
    () => (result?.rows ? compact(Array.from(result.rows || [])) : ''),
    [result?.rows]
  )

  function onDownloadCSV() {
    csvRef.current?.link.click()
    Telemetry.sendEvent('sql_editor', 'sql_download_csv', '')
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
        Telemetry.sendEvent('sql_editor', 'sql_copy_as_markdown', '')
      })
    }
  }

  return (
    <Dropdown
      side="bottom"
      align="start"
      overlay={
        <>
          <Dropdown.Item onClick={onDownloadCSV}>Download CSV</Dropdown.Item>
          <Dropdown.Item onClick={onCopyAsMarkdown}>Copy as markdown</Dropdown.Item>
        </>
      }
    >
      <Button as="span" type="text" iconRight={<IconChevronDown />}>
        Results
      </Button>
      <CSVLink
        ref={csvRef}
        className="hidden"
        data={csvData}
        filename={`supabase_${project?.ref}_${snap.snippets[id]?.snippet.name}`}
      />
    </Dropdown>
  )
}

export default ResultsDropdown
